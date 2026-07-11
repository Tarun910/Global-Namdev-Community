import { Registration } from '../types';
import { isValidLocalMobile } from './demoAuth';

export function validateRegistrationFields(
  values: Pick<
    Registration,
    | 'fullName'
    | 'fathersName'
    | 'dobOrAge'
    | 'mobileNumber'
    | 'education'
    | 'occupation'
    | 'state'
    | 'district'
    | 'city'
  >
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.fullName?.trim()) errors.fullName = 'Full Name is required';
  if (!values.fathersName?.trim()) errors.fathersName = "Father's Name is required";
  if (!values.dobOrAge?.trim()) errors.dobOrAge = 'DOB or Age is required';
  if (!values.mobileNumber?.trim()) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!isValidLocalMobile(values.mobileNumber)) {
    errors.mobileNumber = 'Enter a valid mobile number';
  }
  if (!values.education?.trim()) errors.education = 'Education details are required';
  if (!values.occupation?.trim()) errors.occupation = 'Occupation details are required';
  if (!values.state?.trim()) errors.state = 'State is required';
  if (!values.district?.trim()) errors.district = 'District is required';
  if (!values.city?.trim()) errors.city = 'City is required';

  return errors;
}
