export default function compareBy(prop) {
  return (a, b) => {
    if (a.get(prop) > b.get(prop)) {
      return 1;
    } else if (a.get(prop) < b.get(prop)) {
      return -1;
    }
    return 0;
  };
}
