// Định nghĩa các điểm A, B và C
const A = { time_t: 1696870800, price: 10.271685878962536 };
const B = { time_t: 1696179600, price: 10.763400576368875 };
const C = { time_t: 1696871000, price: 10.7 };

// Tính giá trị a và b cho phương trình đường thẳng y = ax + b
let a = (B.price - A.price) / (B.time_t - A.time_t);
let b = A.price - a * A.time_t;

console.log("a", a);
console.log("b", b);

// Thay giá trị C.time_t vào x để tính y
let y = a * C.time_t + b;
console.log("y: ", y);

// So sánh giá trị C.price với y để đưa ra kết luận
if (C.price >= y) {
  console.log("Nằm trên");
} else {
  console.log("Nằm dưới");
}
