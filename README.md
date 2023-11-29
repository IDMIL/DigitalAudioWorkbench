/*
<!-- note to maintainers:

This document serves as both the README for the project and as the source
code for the heart of the simulation. This is done since certain aspects of the
documentation of the project can only be adequately precise by including source
code inline; rather than duplicate the code across the documentation page and
the source document, they are kept together in one place. As such, the prose
block at the beginning and the code block at the end are carefully enclosed in
interlocking delimiters so that javascript ignores the README text and the
README pretty-prints the javascript source. Take care not to disturb these
block delimeters.

Futhermore, take care to limit the scope of the source code in this document
to only that which is essential for understanding the core of the simulation.

-->

# The Digital Audio Workbench

https://idmil.gitlab.io/course-materials/mumt203/interactive-demos 

## Introduction

The purpose of the digital audio workbench is to illustrate key concepts in
digital audio theory with interactive visualizations of each stage of the
analog-to-digial conversion (ADC) and digital-to-analog conversion (DAC)
processes.  These visualizations are inspired by demonstrations using
oscilloscopes and spectrum analyzers to compare the analog signal input into
the ADC process with the analog signal output by the DAC process, e.g.
https://youtu.be/cIQ9IXSUzuM

By experimenting with the settings of the simulation, numerous key concepts in
digital signal theory can be nicely illustrated, such as aliasing, quantization
error, critical sampling, under and oversampling, and many others.  The
interactive interface allows the simulation to be explored freely; users can
examine the signals both visually through numerous graphs, or by listening to
the test signals directly.

## Implementation

Since our demonstration takes place purely in the digital domain, we
unfortunately cannot use real continuous time analog inputs and outputs.
Instead, we simulate the ADC-DAC processes in the discrete time domain.  The
analog input and output are represented as discrete time signals with a high
sampling rate; at the time of writing, the maximum sampling rate supported
by WebAudio is 96 kHz. 

The ADC process consists of several steps, including antialiasing, sampling,
and quantization. All of these are simulated in our model: antialiasing is
achieved with a windowed sinc FIR lowpass filter of order specified by the
user; sampling is approximated by downsampling the input signal by an
integer factor; and quantization is achieved by multiplying the sampled
signal (which ranges from -1.0 to 1.0) by the maximum integer value possible
given the requested bit depth (e.g. 255 for a bit depth of 8 bits), and then
rounding every sample to the nearest integer.  The DAC process is simulated
in turn by zero stuffing and lowpass filtering the sampled and quantized
output of the ADC simultion.  

In summary, the continuous time input is simulated by a 96 kHz discrete time
signal, the sampled output of the ADC process is simulated by a downsampled
and quantized signal, and the continuous time reconstruction output by the
DAC is simulated by upsampling the "sampled" signal back to 96 kHz.  In our
tests we have found this model to be reasonable; many key concepts, such as
critical sampling, aliasing, and quantization noise are well represented in
our simulation.

For more details, the reader is encouraged to peruse the rest of the source
code in this document.  Many comments have been included to aid readers who
are unfamiliar with javascript.  Any questions you may have about the
implementation of the simulation can only be definitively answered by
understanding the source code, but please feel free to contact the project
maintainers if you have any questions.

```javascript
*/

// `renderWavesImpl` returns an anonymous function that is bound in the widget
// constructor. This is done in order to seperate the implementation of the
// simulation from the other implementation details so that this documentation
// can be more easily accessed. 

const soundTimeSeconds = 1.5;
const fadeTimeSeconds = 0.125;
function renderWavesImpl(settings, fft, p) { return (playback = false) => {

  // if we are not rendering for playback, we are rendering for simulation
  let simulation = !playback; 

  // select the buffer to render to; playback buffer, or simulation buffer
  var original = playback ? settings.original_pb : settings.original;
  var reconstructed = playback ? settings.reconstructed_pb : settings.reconstructed;
  var stuffed = settings.stuffed;

  // calculate harmonics ------------------------------------------------------

  // The signal is generated using simple additive synthesis. Because of this,
  // the exact frequency content of the signal can be determined a priori based
  // on the settings. We generate this information here so that it can be used
  // not only by the synthesis process below, but also by several of the graphs
  // used to illustrate the frequency domain content of the signal.

  // We only calculate the harmonics for the simulation; it is assumed they will
  // already have been calculated earlier when rendering for playback

  if (simulation) {
    let harmonic_number = 1; 
    let harmonic_amplitude = 1; 
    let invert = 1;
    let harmInc = (settings.harmType =="Odd" || settings.harmType == "Even") ? 2 : 1;
  
    for (let i = 0; simulation && i < settings.numHarm; i++) {
  
      // the amplitude of each harmonic depends on the harmonic slope setting
      if (settings.harmSlope == "lin") harmonic_amplitude = 1 - i/settings.numHarm;
      else if (settings.harmSlope == "1/x") harmonic_amplitude = 1/harmonic_number;
      else if (settings.harmSlope == "1/x2") harmonic_amplitude = 1/harmonic_number/harmonic_number;
      else if (settings.harmSlope == "flat") harmonic_amplitude = 1;
  
      // In case the harmonic slope is 1/x^2 and the harmonic type is "odd",
      // by inverting every other harmonic we generate a nice triangle wave.
      if (settings.harmSlope =="1/x2" && settings.harmType == "Odd") {
        harmonic_amplitude = harmonic_amplitude * invert;
        invert *= -1;
      }
  
      // the frequency of each partial is a multiple of the fundamental frequency
      settings.harmonicFreqs[i] = harmonic_number*settings.fundFreq;
  
      // The harmonic amplitude is calculated above according to the harmonic
      // slope setting, taking into account the special case for generating a
      // triangle.
      settings.harmonicAmps[i] = harmonic_amplitude;
  
      // With harmonic type set to "even" we want the fundamental and even
      // harmonics. To achieve this, we increment the harmonic number by 1 after
      // the fundamental and by 2 after every other partial.
      if (i == 0 && settings.harmType == "Even") harmonic_number += 1;
      else harmonic_number += harmInc;
    }
  }

  // render original wave -----------------------------------------------------

  // initialize the signal buffer with all zeros (silence)
  original.fill(0);

  // For the sample at time `n` in the signal buffer `original`, 
  // generate the sum of all the partials based on the previously calculated
  // frequency and amplitude values.
  original.forEach( (_, n, arr) => {
    for (let harmonic = 0; harmonic < settings.numHarm; harmonic++) {

      let fundamental_frequency = settings.harmonicFreqs[0];
      let frequency = settings.harmonicFreqs[harmonic];
      let amplitude = settings.harmonicAmps[harmonic];

      // convert phase offset specified in degrees to radians
      let phase_offset = Math.PI / 180 * settings.phase;

      // adjust phase offset so that harmonics are shifted appropriately
      let phase_offset_adjusted = phase_offset * frequency / fundamental_frequency;

      let radian_frequency = 2 * Math.PI * frequency;
      let phase_increment = radian_frequency / WEBAUDIO_MAX_SAMPLERATE;
      let phase = phase_increment * n + phase_offset_adjusted;

      // accumulate the amplitude contribution from the current harmonic
      arr[n] += amplitude * Math.sin( phase );
    }
  });

  // linearly search for the maximum amplitude value (easy but not efficient)
  let max = 0;
  original.forEach( (x, n, y) => {if (x > max) max = x} );

  // normlize and apply amplitude scaling
  original.forEach( (x, n, y) => y[n] = settings.amplitude * x / max );

  // apply antialiasing filter if applicable ----------------------------------

  // The antialiasing and reconstruction filters are generated using Fili.js.
  // (https://github.com/markert/fili.js/)
  let firCalculator = new Fili.FirCoeffs();
  // Fili uses the windowed sinc method to generate FIR lowpass filters.
  // Like real antialiasing and reconstruction filters, the filters used in the
  // simulation are not ideal brick wall filters, but approximations.

  // apply antialiasing only if the filter order is set
  if (settings.antialiasing > 1) { 

    // specify the filter parameters; Fs = sampling rate, Fc = cutoff frequency

    // The cutoff for the antialiasing filter is set to the Nyquist frequency
    // of the simulated sampling process. The sampling rate of the "sampled"
    // signal is WEBAUDIO_MAX_SAMPLERATE / the downsampling factor. This is
    // divided by 2 to get the Nyquist frequency.
    var filterCoeffs = firCalculator.lowpass(
        { order: settings.antialiasing
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
        });

    // generate the filter
    var filter = new Fili.FirFilter(filterCoeffs);

    // apply the filter
    original.forEach( (x, n, y) => y[n] = filter.singleStep(x) );

    // time shift the signal by half the filter order to compensate for the
    // delay introduced by the FIR filter
    original.forEach( (x, i, arr) => arr[i - settings.antialiasing/2] = x );
  }

  // downsample original wave -------------------------------------------------

  // zero initialize the reconstruction, and zero stuffed buffers
  reconstructed.fill(0);
  stuffed.fill(0);

  // generate new signal buffers for the downsampled signal and quantization
  // noise whose sizes are initialized according to the currently set
  // downsampling factor
  let downsampled;
  let quantNoise;
  if (playback) {
    settings.downsampled_pb = new Float32Array(p.round(original.length / settings.downsamplingFactor));
    settings.quantNoise_pb = new Float32Array(p.round(original.length / settings.downsamplingFactor));
    downsampled = settings.downsampled_pb;
    quantNoise = settings.quantNoise_pb;
  } else {
    settings.downsampled = new Float32Array(p.round(original.length / settings.downsamplingFactor));
    settings.quantNoise = new Float32Array(p.round(original.length / settings.downsamplingFactor));
    downsampled = settings.downsampled;
    quantNoise = settings.quantNoise;
  }
  let quantNoiseStuffed = settings.quantNoiseStuffed;
  quantNoiseStuffed.fill(0);

  // calculate the maximum integer value representable with the given bit depth
  // or generate a floating point quantizer
  let floats;
  let stepSize;
  if (settings.encType == "Fixed Point") {
    maxInt = p.pow(2, settings.bitDepth) - 1;
    stepSize = (settings.quantType == "midTread") ? 2 / (maxInt - 1) : 2 / maxInt;
  } else if (settings.encType == "Floating Point") {
    floats = new nFloat(settings.bitDepth);
  }

  // generate the output of the simulated ADC process by "sampling" (actually
  // just downsampling), and quantizing with dither. During this process, we
  // also load the buffer for the reconstructed signal with the sampled values;
  // this allows us to skip an explicit zero-stuffing step later

  downsampled.forEach( (_, n, arr) => {

    // keep only every kth sample where k is the integer downsampling factor
    let y = original[n * settings.downsamplingFactor];
    y = y > 1.0 ? 1.0 : y < -1.0 ? -1.0 : y; // apply clipping

    // if the bit depth is set to the maximum, we skip quantization and dither
    if (settings.bitDepth == BIT_DEPTH_MAX) {

      // record the sampled output of the ADC process
      arr[n] = y;

      // sparsely fill the reconstruction and zero stuffed buffers to avoid
      // having to explicitly zero-stuff
      reconstructed[n * settings.downsamplingFactor] = y;
      stuffed[n * settings.downsamplingFactor] = y * settings.downsamplingFactor;
      return;
    }

    // generate dither noise
    let dither = (2 * Math.random() - 1) * settings.dither;

    let quantized;
    // Add dither signal and quantize. Constrain so we dont clip after dither
    if (settings.encType == "Fixed Point") { 
      switch(settings.quantType) {
        case "midTread" :
          quantized = stepSize * p.floor(p.constrain((y + dither), -1, 0.99) / stepSize + 0.5);
          break;
        case "midRise" :
          quantized = stepSize * (p.floor(p.constrain((y + dither), -1, 0.99) / stepSize) + 0.5);
          break;
      }
    } else if (settings.encType == "Floating Point") {
      quantized = floats.getQuantizationValue(p.constrain((y + dither), -1, 0.99))[1];
    }

    // record the sampled and quantized output of the ADC process with clipping
    arr[n] = quantized;


    // sparsely fill the reconstruction buffer to avoid having to zero-stuff
    reconstructed[n * settings.downsamplingFactor] = quantized;
      stuffed[n * settings.downsamplingFactor] = quantized * settings.downsamplingFactor;

    // record the quantization error
    quantNoise[n] = quantized - y;
    quantNoiseStuffed[n * settings.downsamplingFactor] = quantNoise[n];
  });

  // render reconstructed wave by low pass filtering the zero stuffed array----

  // specify filter parameters; as before, the cutoff is set to the Nyquist
  var filterCoeffs = firCalculator.lowpass(
      { order:  200
      , Fs: WEBAUDIO_MAX_SAMPLERATE
      , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
      });

  // generate the filter
  var filter = new Fili.FirFilter(filterCoeffs);

  // apply the filter
  reconstructed.forEach( (x, n, arr) => {
    let y = filter.singleStep(x);

    // To retain the correct amplitude, we must multiply the output of the
    // filter by the downsampling factor.
    arr[n] = y * settings.downsamplingFactor;
  });

  // time shift the signal by half the filter order to compensate for the delay
  // introduced by the FIR filter
  reconstructed.forEach( (x, n, arr) => arr[n - 100] = x );

  // render FFTs --------------------------------------------------------------
  // TODO: apply windows?

  // The FFTs of the signals at the various stages of the process are generated
  // using fft.js (https://github.com/indutny/fft.js). The call to
  // `realTransform()` performs the FFT, and the call to `completeSpectrum`
  // fills the upper half of the spectrum, which is otherwise not calculated
  // since it is a redundant reflection of the lower half of the spectrum.

  if (simulation) {
    fft.realTransform(settings.originalFreq, original);
    fft.completeSpectrum(settings.originalFreq);

    fft.realTransform(settings.stuffedFreq, stuffed)
    fft.completeSpectrum(settings.reconstructedFreq);

    fft.realTransform(settings.reconstructedFreq, reconstructed)
    fft.completeSpectrum(settings.reconstructedFreq);

    fft.realTransform(settings.quantNoiseFreq, quantNoiseStuffed)
    fft.completeSpectrum(settings.quantNoiseFreq); 
  }

  // fade in and out and suppress clipping distortions ------------------------

  // Audio output is windowed to prevent pops. The envelope is a simple linear
  // ramp up at the beginning and linear ramp down at the end. 

  if (playback) {
    // This normalization makes sure the original signal isn't clipped.
    // The output is clipped during the simulation, so this may reduce its peak
    // amplitude a bit, but since the clipping adds distortion the perceived
    // loudness is relatively the same as the original signal in my testing.
    let normalize = settings.amplitude > 1.0 ? settings.amplitude : 1.0;

    // Define the fade function
    let fade = (_, n, arr) => {
      let fadeTimeSamps = Math.min(fadeTimeSeconds * WEBAUDIO_MAX_SAMPLERATE, arr.length / 2);
      // The conditional ensures there is a fade even if the fade time is longer than the signal
      if (n < fadeTimeSamps) 
        arr[n] = (n / fadeTimeSamps) * arr[n] / normalize;
      else if (n > arr.length - fadeTimeSamps) 
        arr[n] = ((arr.length - n) / fadeTimeSamps) * arr[n] / normalize;
      else arr[n] = arr[n] / normalize;
    };

    // Apply the fade function
    original.forEach(fade);
    reconstructed.forEach(fade);
    quantNoise.forEach(fade);
  }


}}
/*
```
*/
