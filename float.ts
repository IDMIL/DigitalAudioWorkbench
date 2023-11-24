class nFloat {
  // Custom floating point class to represent any n-bit float using IEEE standards
  // 1-3 bit floats cannot fully follow IEEE standards, so they have custom definitions
  // This class is used to simulate floating-point encoding
  private numBits: number;
  private exponentSize: number;
  private mantissaSize: number;
  private bias: number;
  private binaryValues: string[] = [];
  private decimalValues: number[] = [];
  
  constructor(numBits: number) {
    this.numBits = numBits;
    
    // https://en.wikipedia.org/wiki/Minifloat#4_bits_and_fewer
    // One bit is always reserved for the sign in this implementation (contrary to the above article)
    // Infinity values have the highest exponent with a mantissa of all 0s
    // NaN values have the highest exponent with a mantissa of all 1s
    // Subnormal values have the an exponent of all 0s with a non-zero mantissa
    // Normal values have a non-zero exponent and non-zero mantissa
    // These rules do not hold for < 3 bit floats, for example:
    // If we were following proper IEEE principles, we would have the 1-bit float consist of only the exponent, however, this only gives us values 0 and Inf
    // This implementation is just a signed number, but it is impossible to follow IEEE standards for a float of less than 4 bits
    if (numBits < 1) throw new Error("Invalid number of bits");
    switch (numBits) {
      case 1:
        // Values -1, 1
        this.exponentSize = 0;
        this.mantissaSize = 0;
        this.bias = 0;
        break;
      case 2:
        // Values -1, 0, 1
        this.exponentSize = 0;
        this.mantissaSize = 1;
        this.bias = 1;
        break;
      case 3:
        // Values -1, 0, 1, Inf, NaN
        this.exponentSize = 1;
        this.mantissaSize = 1;
        this.bias = 1;
        break;
      default:
        this.exponentSize = Math.ceil((this.numBits - 1) / 2);
        this.mantissaSize = this.numBits - 1 - this.exponentSize;
        this.bias = Math.pow(2, this.exponentSize - 1) - 1;
    }

    // Manualy define values for 1-3 bit floats
    if (this.numBits === 1) {
      this.binaryValues = ["0", "1"];
      this.decimalValues = [-1, 1];
      return;
    }
    if (this.numBits === 2) {
      this.binaryValues = ["00", "01", "10", "11"];
      this.decimalValues = [0, 1, 0, -1];
      return;
    }
    if (this.numBits === 3) {
      this.binaryValues = ["000", "001", "010", "011", "100", "101", "110", "111"];
      this.decimalValues = [0, 1, Infinity, NaN, 0, -1, Infinity, NaN];
      return;
    }
    
    // Generate all possible binary permutations of the given bit size
    this.binaryValues = [];
    for (let i = 0; i < Math.pow(2, this.numBits); i++) {
      let binaryRepresentation = i.toString(2).padStart(this.numBits, "0");
      this.binaryValues.push(binaryRepresentation);

      // Convert the binary representation to a decimal value
      let exponentStr = binaryRepresentation.slice(1, this.exponentSize + 1);
      let mantissaStr = binaryRepresentation.slice(this.exponentSize + 1, this.exponentSize + this.mantissaSize + 1);
      let mantissa = parseInt(mantissaStr, 2);
      let highestExponent = "1".repeat(this.exponentSize);

      // Check for special values (Infinity, NaN, 0)
      if (exponentStr === highestExponent) {
        if (mantissa === 0) {
          this.decimalValues.push(Infinity);
        } else {
          this.decimalValues.push(NaN);
        }
        continue;
      }
      let exponent = parseInt(exponentStr, 2);
      if (exponent === 0 && mantissa === 0) {
        this.decimalValues.push(0);
        continue;
      }
      // Significand extension depends on if the number is normalized or subnormal
      let extension = (exponent === 0) ? 0 : 1;
      this.decimalValues.push(Math.pow(-1, parseInt(binaryRepresentation[0])) * (extension + mantissa) * Math.pow(2, exponent - this.bias));
    }
  }
  public getQuantizationValue(toQuantize: number): [string, number] {
    if (toQuantize === 0) return ["0".repeat(this.numBits), 0];
    let closestIndices: number[] = [];
    let smallestDifference = Math.abs(this.decimalValues[0] - toQuantize);

    for (let i = 0; i < this.decimalValues.length; i++) {
      let difference = Math.abs(this.decimalValues[i] - toQuantize);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestIndices = [i];
      } else if (difference === smallestDifference) {
        closestIndices.push(i);
      }
    }

    // If there are multiple values with the same difference, choose the one with the smallest exponent (IEEE standards)
    let exponentSize = 0;
    let index = closestIndices[0];
    for (let i = 0; i < closestIndices.length; i++) {
      let newExpSize = parseInt(this.binaryValues[closestIndices[i]].slice(1, this.exponentSize + 1), 2);
      if (newExpSize < exponentSize) {
        exponentSize = newExpSize;
        index = closestIndices[i];
      }
    }
    return [this.binaryValues[index], this.decimalValues[index]];
  }
  public getBinaryRepresentation(number: number): string {
    let index = this.decimalValues.indexOf(number);
    if (index === -1) {
      throw new Error("Number not found");
    }
    return this.binaryValues[index];
  }
  public getDecimalRepresentation(binary: string): number {
    let index = this.binaryValues.indexOf(binary);
    if (index === -1) {
      throw new Error("Number not found");
    }
    return this.decimalValues[index];
  }
  public getQuantLevels() {
    let uniqueValues: number[] = [];
    for (let i = 0; i < this.decimalValues.length; i++) {
      if (typeof this.decimalValues[i] === 'number' && !uniqueValues.includes(this.decimalValues[i])) {
        uniqueValues.push(this.decimalValues[i]);
      }
    }
    return uniqueValues;
  }
  public getBinaryValues() {
    return this.binaryValues;
  }
  public getDecimalValues() {
    return this.decimalValues;
  }
}