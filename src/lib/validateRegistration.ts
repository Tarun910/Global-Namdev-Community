import { Registration } from '../types';
import { COUNTRY_NAMES } from './countries';
import { isValidLocalMobile } from './demoAuth';
import {
  isValidDobOrAge,
  isValidEmail,
  isValidLocationText,
  isValidOptionalPersonName,
  isValidPersonName,
  isValidRequiredText,
} from './formValidation';
import { hasCachedStatesForCountry, isValidStateForCountry } from './regions';

export function validateRegistrationFields(
  values: Pick<
    Registration,
    | 'fullName'
    | 'fathersName'
    | 'mothersName'
    | 'dobOrAge'
    | 'mobileNumber'
    | 'email'
    | 'education'
    | 'occupation'
    | 'country'
    | 'state'
    | 'district'
    | 'city'
    | 'village'
    | 'gotra'
    | 'photoUrl'
  >
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.fullName?.trim()) {
    errors.fullName = 'Full Name is required';
  } else if (!isValidPersonName(values.fullName)) {
    errors.fullName = 'Enter a valid full name (letters only, at least 2 characters)';
  }

  if (!values.fathersName?.trim()) {
    errors.fathersName = "Father's Name is required";
  } else if (!isValidPersonName(values.fathersName)) {
    errors.fathersName = "Enter a valid father's name (letters only, at least 2 characters)";
  }

  if (!isValidOptionalPersonName(values.mothersName)) {
    errors.mothersName = "Enter a valid mother's name (letters only)";
  }

  if (!values.dobOrAge?.trim()) {
    errors.dobOrAge = 'Date of birth is required';
  } else if (!isValidDobOrAge(values.dobOrAge)) {
    errors.dobOrAge = 'Pick a valid date of birth';
  }

  if (!values.mobileNumber?.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!isValidLocalMobile(values.mobileNumber)) {
    errors.mobileNumber = 'Enter a valid mobile number (6–15 digits)';
  }

  if (values.email?.trim() && !isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.education?.trim()) {
    errors.education = 'Education details are required';
  } else if (!isValidRequiredText(values.education)) {
    errors.education = 'Education must be at least 2 characters';
  }

  if (!values.occupation?.trim()) {
    errors.occupation = 'Occupation details are required';
  } else if (!isValidRequiredText(values.occupation)) {
    errors.occupation = 'Occupation must be at least 2 characters';
  }

  if (!values.country?.trim()) {
    errors.country = 'Country is required';
  } else if (!COUNTRY_NAMES.includes(values.country)) {
    errors.country = 'Select a valid country from the list';
  }

  if (!values.state?.trim()) {
    errors.state = 'State is required';
  } else if (values.country && hasCachedStatesForCountry(values.country)) {
    if (!isValidStateForCountry(values.country, values.state)) {
      errors.state = 'Select a valid state for the chosen country';
    }
  } else if (!isValidLocationText(values.state)) {
    errors.state = 'Enter a valid state or province name';
  }

  if (!values.district?.trim()) {
    errors.district = 'District is required';
  } else if (!isValidLocationText(values.district)) {
    errors.district = 'Enter a valid district name';
  }

  if (!values.city?.trim()) {
    errors.city = 'City is required';
  } else if (!isValidLocationText(values.city)) {
    errors.city = 'Enter a valid city name';
  }

  if (values.village?.trim() && !isValidLocationText(values.village)) {
    errors.village = 'Enter a valid village name';
  }

  if (values.gotra?.trim() && !isValidRequiredText(values.gotra)) {
    errors.gotra = 'Gotra must be at least 2 characters';
  }

  if (!values.photoUrl?.trim()) {
    errors.photoUrl = 'Member photo is required';
  }

  return errors;
}
