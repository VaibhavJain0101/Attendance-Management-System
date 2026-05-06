export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString();
};

export const formatHours = (value) => {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(2)} hrs`;
};

export const formatDateOnly = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString();
};
