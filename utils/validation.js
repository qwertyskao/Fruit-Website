// Các hàm kiểm tra dữ liệu đầu vào dùng chung cho controller.
const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) =>
  typeof value === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const isNonNegativeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
  if (typeof value !== 'string' || value.trim() === '') return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
};

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isNonNegativeNumber,
};
