import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";

const sikkim = state("SK", "Sikkim", [
  d("Gangtok"), d("Mangan"), d("Namchi"), d("Gyalshing"), d("Pakyong"), d("Soreng"),
]);

const manipur = state("MN", "Manipur", [
  d("Bishnupur"), d("Chandel"), d("Churachandpur"), d("Imphal East", "Porompat"),
  d("Imphal West", "Imphal"), d("Jiribam"), d("Kakching"), d("Kamjong"),
  d("Kangpokpi"), d("Noney"), d("Pherzawl"), d("Senapati"), d("Tamenglong"),
  d("Tengnoupal"), d("Thoubal"), d("Ukhrul"),
]);

const meghalaya = state("ML", "Meghalaya", [
  d("East Garo Hills", "Williamnagar"), d("East Jaintia Hills", "Khliehriat"),
  d("East Khasi Hills", "Shillong"), d("Eastern West Khasi Hills", "Mairang"),
  d("North Garo Hills", "Resubelpara"), d("Ri Bhoi", "Nongpoh"),
  d("South Garo Hills", "Baghmara"), d("South West Garo Hills", "Ampati"),
  d("South West Khasi Hills", "Mawkyrwat"), d("West Garo Hills", "Tura"),
  d("West Jaintia Hills", "Jowai"), d("West Khasi Hills", "Nongstoin"),
]);

const mizoram = state("MZ", "Mizoram", [
  d("Aizawl"), d("Champhai"), d("Hnahthial"), d("Khawzawl"), d("Kolasib"),
  d("Lawngtlai"), d("Lunglei"), d("Mamit"), d("Saiha"), d("Saitual"), d("Serchhip"),
]);

const nagaland = state("NL", "Nagaland", [
  d("Chumoukedima"), d("Dimapur"), d("Kiphire"), d("Kohima"), d("Longleng"),
  d("Mokokchung"), d("Mon"), d("Niuland"), d("Noklak"), d("Peren"), d("Phek"),
  d("Shamator"), d("Tseminyu"), d("Tuensang"), d("Wokha"), d("Zunheboto"),
]);

const tripura = state("TR", "Tripura", [
  d("Dhalai", "Ambassa"), d("Gomati", "Udaipur"), d("Khowai"),
  d("North Tripura", "Dharmanagar"), d("Sepahijala", "Bishalgarh"),
  d("South Tripura", "Belonia"), d("Unakoti", "Kailashahar"),
  d("West Tripura", "Agartala"),
]);

export const eastNe2States: StateSeed[] = [
  sikkim, manipur, meghalaya, mizoram, nagaland, tripura,
];
