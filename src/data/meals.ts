// DIET LIBRARY — pure veg + dairy (onion/garlic OK, no eggs). Mess, outside or home-cooked.
// 5 options per slot. Values are per portion shown, estimated from Indian food tables (IFCT 2017) and
// standard nutrition data; home recipes vary ±10–15%. kcal / p (protein g) / c (carbs g) / f (fat g) / fib (fibre g)
// tags: micronutrients the option is a good source of -> b12 · d · iron · calcium · zinc · omega3 · vitc
// Naya option jodna ho: kisi bhi slot mein ek line add karo (id unique rakho).
import type { Slot } from '../lib/fit';

export const meals: Slot[] = [
  {
    id: 'early', name: 'Early morning', time: '06:45',
    options: [
      { id: 'e-nuts', name: '5 soaked almonds + 2 walnut halves', portion: 'with warm water', kcal: 61, p: 2, c: 1.5, f: 5.5, fib: 1, tags: ['omega3'] },
      { id: 'e-banana', name: 'Banana', portion: '1 medium', kcal: 105, p: 1.3, c: 27, f: 0.4, fib: 3.1 },
      { id: 'e-chana', name: 'Soaked kala chana', portion: '30 g dry', kcal: 110, p: 6, c: 18, f: 1.5, fib: 5, tags: ['iron', 'zinc'] },
      { id: 'e-chia', name: 'Lemon water + soaked chia', portion: '1 tbsp (10 g)', kcal: 49, p: 1.7, c: 4.2, f: 3.1, fib: 3.4, tags: ['omega3', 'calcium', 'vitc'] },
      { id: 'e-apple', name: 'Apple + 5 almonds', portion: '1 medium', kcal: 130, p: 1.7, c: 26, f: 3, fib: 5 },
    ],
  },
  {
    id: 'breakfast', name: 'Breakfast', time: '08:30',
    options: [
      { id: 'b-chilla', name: 'Moong dal chilla ×2, paneer stuffing + chutney', portion: '60 g dal · 50 g paneer', kcal: 390, p: 23, c: 38, f: 11, fib: 9, tags: ['iron', 'calcium'] },
      { id: 'b-oats', name: 'Oats in milk + banana', portion: '50 g oats · 250 ml milk', kcal: 445, p: 16, c: 72, f: 11, fib: 8, tags: ['calcium', 'b12', 'zinc'] },
      { id: 'b-poha', name: 'Poha with peanuts + curd', portion: '1.5 cups · 200 g curd', kcal: 460, p: 14, c: 57, f: 20, fib: 3, tags: ['iron', 'calcium', 'b12'] },
      { id: 'b-idli', name: '3 idli + sambar + coconut chutney', portion: '1 katori sambar', kcal: 375, p: 12, c: 58, f: 10, fib: 8, tags: ['iron'] },
      { id: 'b-hung', name: 'Hung-curd bowl: muesli, apple, chia', portion: '200 g curd · 40 g muesli', kcal: 451, p: 26, c: 54, f: 15.5, fib: 9, tags: ['calcium', 'b12', 'omega3'] },
    ],
  },
  {
    id: 'mid', name: 'Mid-morning', time: '11:30',
    options: [
      { id: 'm-fruit', name: 'Papaya + guava', portion: '150 g + 1 guava', kcal: 133, p: 3, c: 30, f: 1, fib: 8, tags: ['vitc'] },
      { id: 'm-chaas', name: 'Chaas + roasted chana', portion: '300 ml · 30 g', kcal: 170, p: 10, c: 22, f: 4.6, fib: 5, tags: ['calcium', 'iron'] },
      { id: 'm-sprouts', name: 'Sprouts + kala chana chaat, lemon', portion: '1 big katori', kcal: 180, p: 10, c: 30, f: 2, fib: 8, tags: ['iron', 'vitc', 'zinc'] },
      { id: 'm-makhana', name: 'Roasted makhana in ghee', portion: '30 g · 1 tsp ghee', kcal: 150, p: 3, c: 23, f: 5, fib: 2 },
      { id: 'm-milk', name: 'Milk + 2 dates', portion: '250 ml toned', kcal: 195, p: 8, c: 24, f: 7.5, fib: 1.3, tags: ['calcium', 'b12'] },
    ],
  },
  {
    id: 'lunch', name: 'Lunch', time: '13:30',
    options: [
      { id: 'l-thali', name: 'Dal-roti thali: 3 phulka, dal, sabzi, salad, curd', portion: 'mess / home plate', kcal: 696, p: 27, c: 105, f: 17, fib: 20, tags: ['iron', 'calcium', 'b12'] },
      { id: 'l-rajma', name: 'Rajma chawal + salad + curd', portion: '1 katori rajma · 150 g rice', kcal: 490, p: 19, c: 80, f: 9, fib: 11, tags: ['iron', 'zinc'] },
      { id: 'l-paneer', name: 'Paneer sabzi + 2 roti + salad', portion: '100 g paneer', kcal: 570, p: 26, c: 55, f: 26, fib: 9, tags: ['calcium'] },
      { id: 'l-soya', name: 'Soya-veg pulao + raita', portion: '40 g soya · 60 g rice', kcal: 550, p: 30, c: 72, f: 12, fib: 8, tags: ['iron', 'zinc', 'calcium'] },
      { id: 'l-chole', name: 'Chole + 2 roti + salad', portion: '1 katori chole', kcal: 470, p: 17, c: 76, f: 11, fib: 13, tags: ['iron'] },
    ],
  },
  {
    id: 'pre', name: 'Pre-workout', time: '16:45',
    options: [
      { id: 'p-pb', name: 'Banana + peanut butter', portion: '1 banana · 1 tbsp', kcal: 199, p: 4.8, c: 30, f: 8.2, fib: 4 },
      { id: 'p-coffee', name: 'Black coffee + 2 dates + almonds', portion: '10 g almonds', kcal: 105, p: 2, c: 14, f: 5, fib: 2.5 },
      { id: 'p-shakar', name: 'Boiled shakarkandi + chaat masala', portion: '150 g', kcal: 130, p: 2.4, c: 30, f: 0.2, fib: 4.5 },
      { id: 'p-poha', name: 'Small veg poha', portion: '30 g dry', kcal: 160, p: 3.5, c: 25, f: 5, fib: 1.5, tags: ['iron'] },
      { id: 'p-apple', name: 'Apple + chaas', portion: '1 apple · 200 ml', kcal: 135, p: 2.5, c: 28, f: 2, fib: 4.4, tags: ['calcium'] },
    ],
  },
  {
    id: 'post', name: 'Post-workout', time: '18:30',
    options: [
      { id: 'w-whey-b', name: 'Whey in water + banana (+ creatine)', portion: '1 scoop · 1 banana', kcal: 225, p: 25, c: 30, f: 2, fib: 3 },
      { id: 'w-whey-m', name: 'Whey in milk (+ creatine)', portion: '1 scoop · 250 ml toned', kcal: 270, p: 32, c: 15, f: 9, fib: 0, tags: ['calcium', 'b12'] },
      { id: 'w-tikka', name: 'Paneer tikka (air-fried) + mint chutney', portion: '100 g paneer', kcal: 280, p: 18, c: 5, f: 20, fib: 1, tags: ['calcium'] },
      { id: 'w-soya', name: 'Soya chunk chaat', portion: '40 g dry', kcal: 185, p: 21, c: 17, f: 3.5, fib: 6, tags: ['iron', 'zinc'] },
      { id: 'w-hung', name: 'Hung curd + honey', portion: '200 g · 1 tbsp', kcal: 260, p: 20, c: 25, f: 10, fib: 0, tags: ['calcium', 'b12'] },
    ],
  },
  {
    id: 'dinner', name: 'Dinner', time: '20:45',
    options: [
      { id: 'd-dal', name: '2 roti + dal + sabzi + salad', portion: 'regular plate', kcal: 534, p: 20, c: 82, f: 14, fib: 16, tags: ['iron'] },
      { id: 'd-bhurji', name: 'Paneer bhurji + 2 roti + salad', portion: '100 g paneer', kcal: 570, p: 26, c: 55, f: 26, fib: 9, tags: ['calcium'] },
      { id: 'd-khichdi', name: 'Moong dal khichdi + curd + salad', portion: '50 g rice · 40 g dal', kcal: 475, p: 18, c: 74, f: 10, fib: 6, tags: ['calcium', 'b12'] },
      { id: 'd-tofu', name: 'Tofu-veg stir-fry + 1 roti', portion: '150 g tofu', kcal: 413, p: 30, c: 36, f: 19, fib: 7, tags: ['calcium', 'iron'] },
      { id: 'd-besan', name: 'Besan chilla ×2 + curd + salad', portion: '60 g besan', kcal: 378, p: 16, c: 42, f: 14, fib: 8.5, tags: ['iron'] },
    ],
  },
  {
    id: 'bed', name: 'Before bed', time: '22:30',
    options: [
      { id: 'n-haldi', name: 'Haldi milk', portion: '200 ml toned', kcal: 120, p: 6.5, c: 10, f: 6, fib: 0, tags: ['calcium', 'b12'] },
      { id: 'n-curd', name: 'Plain curd', portion: '150 g', kcal: 90, p: 4.5, c: 7, f: 4.5, fib: 0, tags: ['calcium', 'b12'] },
      { id: 'n-paneer', name: 'Paneer cubes', portion: '50 g', kcal: 133, p: 9, c: 1.5, f: 10, fib: 0, tags: ['calcium'] },
      { id: 'n-flax', name: 'Roasted flaxseed + 2 walnut halves', portion: '1 tbsp', kcal: 80, p: 2.4, c: 3, f: 7, fib: 3, tags: ['omega3'] },
      { id: 'n-skip', name: 'Skip — targets already hit', portion: '—', kcal: 0, p: 0, c: 0, f: 0, fib: 0 },
    ],
  },
];

// Micronutrients a pure-veg diet must watch. Food first; supplements only after a blood test / doctor.
export const micros = [
  { tag: 'b12', name: 'Vitamin B12', food: 'Milk, curd, paneer — 2–3 servings daily', note: 'Very common deficiency in vegetarians. Get a blood test; a doctor may suggest a supplement.' },
  { tag: 'd', name: 'Vitamin D', food: '15–20 min of midday sun on arms and face', note: 'Few veg foods have it. Test levels before supplementing.' },
  { tag: 'iron', name: 'Iron', food: 'Chana, rajma, soya, poha, leafy greens', note: 'Add lemon / guava (vitamin C) to the same meal; avoid tea within 1 hour.' },
  { tag: 'calcium', name: 'Calcium', food: 'Milk, curd, paneer, tofu, chia', note: 'Usually covered by 3+ dairy servings a day.' },
  { tag: 'zinc', name: 'Zinc', food: 'Chana, soya, pumpkin seeds, oats', note: 'Soaking / sprouting improves absorption.' },
  { tag: 'omega3', name: 'Omega-3', food: 'Flax, chia, walnuts', note: 'Veg sources give ALA only; an algae-oil supplement is the veg option if a doctor advises.' },
  { tag: 'vitc', name: 'Vitamin C', food: 'Guava, lemon, amla, papaya', note: 'Also boosts iron absorption.' },
];
