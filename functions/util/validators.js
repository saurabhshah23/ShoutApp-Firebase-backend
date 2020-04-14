/** UTILITY FUNCTIONS:
 * isEmpty - bool - true if empty
 * isEmail - bool - true if valid email
 */
const isEmpty = (str) => {
  if (str === undefined || str.trim() === "") return true;
  else return false;
};
const isEmail = (str) => {
  // const regEx = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (str.match(regEx)) return true;
  else return false;
};

/** UTILITY FUNCTIONS - END */

module.exports.validateSignupData = (data) => {
  // Validation and exception handling
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Must not be empty";
  else if (!isEmail(data.email)) errors.email = "Must be a valid email address";
  if (isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Confirm password must match";
  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    isValid: Object.keys(errors).length > 0 ? false : true,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Must not be empty";
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    isValid: Object.keys(errors).length > 0 ? false : true,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio.trim();
  if (!isEmpty(data.location.trim()))
    userDetails.location = data.location.trim();
  if (!isEmpty(data.website.trim())) {
    userDetails.website =
      data.website.trim().substring(0, 4) !== "http"
        ? `http://${data.website.trim()}`
        : data.website.trim();
  }
  return userDetails;
};
