export const getErrorMessage = (error: Error, name = "ValidationError") => {
  return error.name
    ? {
        name: error.name,
        message: error.message,
      }
    : {
        name,
        message: error.message,
      };
};
