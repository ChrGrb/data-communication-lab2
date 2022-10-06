// Short program to encode codewords of length n
// Words are stored integer 

const Polynomial = require("polynomial");

// Global variable to count the total amount of errors in the transmission
var totalErrorsSent = 0;
// Global variable to count the total amount of detected errors in the transmission
var totalErrorsDetected = 0;

// Helper function to convert a decimal number to binary
// Taken from: https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

// Function that converts a Polynomial to a binary string
function pol2bin(pol) {
    // Get the degree of the polynomial to know how long the binary string has to be
    var degree = pol.degree();

    if(degree < 0) {
        return "0";
    }

    var string = "";

    // Convert every term of the polynomial to a digit in the binary number
    for(var i = 0; i <= degree; i++) {
        // If the digit is not defined in the coefficient of the polynomial it's a 0
        if(pol.coeff[i.toString()] == undefined) {
            string += "0";
        } else {
            // If it is defined get the modulus of 2 of the number and add the result to the string
            string += (Math.abs(pol.coeff[i.toString()]) % 2) + "";
        }
    }

    // Reverse the string to get back to big endian format
    return string.split('').reverse().join('');
}



const encodeWord = (generator, informationWord) => {
    // Append the amount of redundant bits in zeros to the information word
    // Get the modulo of the information word with the generator polynomial
    // Add the remainder to the information word

    // Create the generator polynomial from the binary string (reverse it since the lib uses big endian encoding)
    var generatorPolynomial = new Polynomial(dec2bin(generator).split('').reverse());

    // Shifting the zeros into the information word
    // Amount is determined by the degree of the generator polynomial
    var paddedInformationWord = informationWord << generatorPolynomial.degree();

    // Create the polynomial from the information word
    var informationPolynomial = new Polynomial(dec2bin(paddedInformationWord).split('').reverse());

    // Calculate the remainder by getting the polynomial modulus
    var remainderPolynomial = informationPolynomial.mod(generatorPolynomial);

    // Converting the remainder polynomial to a binary string
    remainder = pol2bin(remainderPolynomial);

    // Add the remainder to the information word
    var codeword = paddedInformationWord + parseInt(remainder, 2);

    return codeword;
}


// Function that simulates sending a codeword
const transmitCodeword = (codeword, successProbability) => {
    // Split the codeword to an array
    var codewordBinary = dec2bin(codeword).split('');
    // String containing the binary representation of the transmitted codeword
    var transmittedCodeword = '';
    // False until error is introduced
    var isError = false;

    codewordBinary.forEach(bit => {
        if(Math.random() >= successProbability) {
            // Flip a bit in case of error
            isError = true;
            if(bit == '0') {
                transmittedCodeword += '1';
            } else {
                transmittedCodeword += '0';
            }
        } else {
            transmittedCodeword += bit;
        }
    });

    totalErrorsSent += isError ? 1 : 0;

    return parseInt(transmittedCodeword, 2);
}


const decodeWord = (generator, codeword) => {
    // Create the generator polynomial from the binary string (reverse it since the lib uses big endian encoding)
    var generatorPolynomial = new Polynomial(dec2bin(generator).split('').reverse());

    // Create the polynomial from the information word
    var codePolynomial = new Polynomial(dec2bin(codeword).split('').reverse());

    // Calculate the remainder by getting the polynomial modulus
    var remainderPolynomial = codePolynomial.mod(generatorPolynomial);

    // Converting the remainder polynomial to a binary string
    remainder = pol2bin(remainderPolynomial);
    

    if(parseInt(remainder, 2) != 0) {
        totalErrorsDetected += 1;
        console.log("Error detected");
        console.log(remainderPolynomial);
    }

    var informationWord = codeword >> generatorPolynomial.degree();

    return informationWord;
}

const boundErrorDetection = (probability, hammingDistance, numberOfBits) => {
    var totalBound = 0;

    for(var i = 1; i <= hammingDistance - 1; i++) {
        var rightSide = Math.pow(probability, i) * Math.pow((1 - probability), (numberOfBits - i));
        totalBound += numberOfBits * rightSide + i * rightSide;
    }

    return totalBound;
}


const numTransmissions = 1000;
const generatorPolynomial = 0b1011;
const successProbability = 0.9;

for(var i = 0; i < numTransmissions; i++) {
    var informationWord = Math.floor(Math.random() * 16);
    var codeword = encodeWord(generatorPolynomial, informationWord);
    var transmittedWord = transmitCodeword(codeword, successProbability);
    var informationWord = decodeWord(generatorPolynomial, transmittedWord);
}

console.log("Based on " + numTransmissions + " random transmissions with a success probability of " + successProbability + " yielded an error detection rate of " + (totalErrorsDetected / totalErrorsSent));
console.log("Total errors sent: " + totalErrorsSent);
console.log("Total errors detected: " + totalErrorsDetected);

console.log("Lower theoretical bound for error detection: " + boundErrorDetection(0.9, 3, 7));
