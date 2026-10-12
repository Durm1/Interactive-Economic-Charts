export type PpcPoint = { x: number; y: number };

export function ppcY(x: number, xMax: number, yMax: number, increasing: boolean): number {
  if (x <= 0) return yMax;
  if (x >= xMax) return 0;
  if (!increasing) return yMax * (1 - x / xMax);
  return yMax * (1 - (x / xMax) ** 2);
}

export function ppcOpportunityCost(x: number, xMax: number, yMax: number, increasing: boolean): number {
  if (!increasing) return yMax / xMax;
  const dx = Math.max(0.5, xMax * 0.01);
  const left = Math.max(0, x - dx / 2);
  const right = Math.min(xMax, left + dx);
  const yLeft = ppcY(left, xMax, yMax, true);
  const yRight = ppcY(right, xMax, yMax, true);
  return (yLeft - yRight) / (right - left);
}

export function ppcSamples(xMax: number, yMax: number, increasing: boolean, steps = 48): PpcPoint[] {
  const pts: PpcPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (xMax * i) / steps;
    pts.push({ x, y: ppcY(x, xMax, yMax, increasing) });
  }
  return pts;
}

export type CountryPpc = {
  name: string;
  food: number;
  cloth: number;
};

export function opportunityCostOfFood(country: CountryPpc): number {
  return country.cloth / country.food;
}

export function opportunityCostOfCloth(country: CountryPpc): number {
  return country.food / country.cloth;
}

export type TradeGain = {
  foodOcA: number;
  foodOcB: number;
  clothOcA: number;
  clothOcB: number;
  absoluteFood: string;
  absoluteCloth: string;
  comparativeFood: string;
  comparativeCloth: string;
  mutuallyBeneficial: boolean;
  /** Cloth received per unit of food. */
  terms: number;
};

export function analyseTrade(a: CountryPpc, b: CountryPpc, terms: number): TradeGain {
  const foodOcA = opportunityCostOfFood(a);
  const foodOcB = opportunityCostOfFood(b);
  const clothOcA = opportunityCostOfCloth(a);
  const clothOcB = opportunityCostOfCloth(b);
  const aFood = foodOcA < foodOcB - 1e-9;
  const bFood = foodOcB < foodOcA - 1e-9;
  const low = Math.min(foodOcA, foodOcB);
  const high = Math.max(foodOcA, foodOcB);
  return {
    foodOcA,
    foodOcB,
    clothOcA,
    clothOcB,
    absoluteFood: a.food === b.food ? "neither" : a.food > b.food ? a.name : b.name,
    absoluteCloth: a.cloth === b.cloth ? "neither" : a.cloth > b.cloth ? a.name : b.name,
    comparativeFood: aFood ? a.name : bFood ? b.name : "neither",
    comparativeCloth: aFood ? b.name : bFood ? a.name : "neither",
    mutuallyBeneficial: terms > low + 1e-9 && terms < high - 1e-9,
    terms,
  };
}

/** Trading possibility intercepts after specialising in the comparative-advantage good. */
export function tradingPossibility(country: CountryPpc, specialisesInFood: boolean, terms: number): PpcPoint[] {
  if (specialisesInFood) {
    const cloth = country.food * terms;
    return [
      { x: country.food, y: 0 },
      { x: 0, y: cloth },
    ];
  }
  const food = country.cloth / terms;
  return [
    { x: 0, y: country.cloth },
    { x: food, y: 0 },
  ];
}
