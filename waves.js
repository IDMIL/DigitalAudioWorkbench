function renderWavesImpl(settings, fft, p) { return () => {
  let firCalculator = new Fili.FirCoeffs();
  // calculate harmonics
  let harmInc = 1; harmAmp =1; harmScale =1; harmonic = 1; let inv= 1;
  if (settings.harmType =="Odd" || settings.harmType == "Even"){ harmInc=2;}
  while (harmonic<=settings.numHarm){
    if (settings.harmSlope == "lin") {  harmAmp = 1 - (harmonic-1)/(settings.numHarm)}
     else if (settings.harmSlope == "1/x") {harmAmp = 1/harmScale}
     else if (settings.harmSlope == "1/x2") {harmAmp = 1/harmScale/harmScale}
     else if (settings.harmSlope == "flat") {harmAmp = 1};
     if (settings.harmSlope =="1/x2" && settings.harmType == "Odd"){
       harmAmp = harmAmp *inv;
       inv *= -1;
     }
    settings.harmonicFreqs[harmonic-1] = harmScale*settings.fundFreq;
    settings.harmonicAmps[harmonic-1] = harmAmp;

    (harmonic ==1 && settings.harmType != "Odd")? harmScale++ : harmScale +=harmInc;

    harmonic++;
  }

  // render original wave
  settings.original.fill(0);

  settings.original.forEach( (_, i, arr) => {
    let harmonic =1;
    //Always calculate number of harmonics. omegaScale is the frequency scalar for each
    while (harmonic<=settings.numHarm){
      let freq = 2*Math.PI*settings.harmonicFreqs[harmonic-1]/WEBAUDIO_MAX_SAMPLERATE;
      let amp = settings.harmonicAmps[harmonic-1];
      //scale to radians, adjust harmonic phases
      let phase = Math.PI/180*settings.phase*settings.harmonicFreqs[harmonic-1]/settings.harmonicFreqs[0];
      arr[i] += settings.amplitude * Math.sin(freq * i + phase )*amp;
      harmonic++;
    }
  });

  // render original wave FFT
  // TODO: window the input
  fft.realTransform(settings.originalFreq, settings.original);
  fft.completeSpectrum(settings.originalFreq);

  // apply antialiasing filter if applicable
  var original = settings.original;
  if (settings.antialiasing > 1) {
    var filterCoeffs = firCalculator.lowpass(
        { order: settings.antialiasing
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
        });
    var filter = new Fili.FirFilter(filterCoeffs);
    original = settings.original.map( x => filter.singleStep(x) );
    original.forEach( (x, i, arr) => arr[i - settings.antialiasing/2] = x );
  }

  // downsample original wave
  settings.reconstructed.fill(0);
  settings.quantNoise.fill(0);
  settings.downsampled = new Float32Array(p.round(WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor));
  let maxInt = p.pow(2, settings.bitDepth)-1;
  let stepSize = (settings.quantType == "midTread")?  2/(maxInt-1) : 2/(maxInt);

  settings.downsampled.forEach( (_, i, arr) => {
    let y = original[i * settings.downsamplingFactor];
    if (settings.bitDepth == BIT_DEPTH_MAX) {
      arr[i] = y;
      settings.reconstructed[i * settings.downsamplingFactor] = y;
      return
    }
    let dither = (2 * Math.random() - 1) * settings.dither;

    let quantized;
    //Add dither signal and quantized. constrain so we dont clip after dither
    switch(settings.quantType){
      case "midTread" :
         quantized = stepSize*p.floor(p.constrain((y+dither),-1,.99)/stepSize + 0.5);
        break;
        case "midRise" :
           quantized = stepSize*(p.floor(p.constrain((y+dither),-1,.99)/stepSize) + 0.5);
          break;
    }
    arr[i] = quantized;
    settings.reconstructed[i * settings.downsamplingFactor] = quantized;
    settings.quantNoise[i] = quantized -y;
  });

  // render reconstructed wave low pass filtering the zero stuffed array
  var filterCoeffs = firCalculator.lowpass(
      { order:  200
      , Fs: WEBAUDIO_MAX_SAMPLERATE
      , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
      });
  var filter = new Fili.FirFilter(filterCoeffs);
  settings.reconstructed.forEach( (x, i, arr) => {
    let y = filter.singleStep(x);
    arr[i] = y * settings.downsamplingFactor;
  });
  settings.reconstructed.forEach( (x, i, arr) => arr[i - 100] = x );

  fft.realTransform(settings.reconstructedFreq, settings.reconstructed)
  fft.completeSpectrum(settings.reconstructedFreq);
  fft.realTransform(settings.quantNoiseFreq, settings.quantNoise)
  fft.completeSpectrum(settings.quantNoiseFreq);
}}
