export const extractApiErrorMessage = (error, fallbackMessage = 'Something went wrong.') => {
  const responseData = error?.data || {};

  if (responseData?.errors && typeof responseData.errors === 'object') {
    const messages = Object.values(responseData.errors).filter(Boolean);
    if (messages.length) {
      return messages.join(', ');
    }
  }

  if (Array.isArray(responseData?.details) && responseData.details.length) {
    const messages = responseData.details.map((detail) => detail?.message).filter(Boolean);
    if (messages.length) {
      return messages.join(', ');
    }
  }

  if (responseData?.message) {
    return responseData.message;
  }

  return fallbackMessage;
};
