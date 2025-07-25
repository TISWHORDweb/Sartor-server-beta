/**
 * Slantapp code and properties {www.slantapp.io}
 */

const {useAsync} = require("./index");
const path = require('path');
const {utils, errorHandle} = require("../core");


exports.generatePasswordWithDate = (fullName) => {
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const specials = '!@#$%^&*';
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1; // Months are 0-indexed
  
  // Create base from name (3-4 chars)
  let base = fullName.replace(/\s+/g, '').toLowerCase();
  base = base.length >= 3 ? base.slice(0, 3) : base + consonants.charAt(Math.floor(Math.random() * consonants.length));
  
  // Add random consonants and vowels (2 chars)
  base += consonants.charAt(Math.floor(Math.random() * consonants.length));
  base += vowels.charAt(Math.floor(Math.random() * vowels.length));
  
  // Add date components (2 chars)
  base += day.toString().slice(-1);
  base += month.toString().slice(-1);
  
  // Add special character and number (2 chars)
  base += specials.charAt(Math.floor(Math.random() * specials.length));
  base += Math.floor(Math.random() * 10);
  
  // Ensure minimum 8 characters by padding if needed
  while (base.length < 8) {
    const allChars = consonants + vowels + specials + '0123456789';
    base += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the characters for better security
  return base.split('').sort(() => 0.5 - Math.random()).join('');
};

