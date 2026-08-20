import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";
import { southExtraStates } from "./south-extra.js";

const tamilNadu = state("TN", "Tamil Nadu", [
  d("Ariyalur"), d("Chengalpattu"), d("Chennai"), d("Coimbatore"), d("Cuddalore"),
  d("Dharmapuri"), d("Dindigul"), d("Erode"), d("Kallakurichi"),
  d("Kancheepuram", "Kanchipuram"), d("Kanyakumari", "Nagercoil"), d("Karur"),
  d("Krishnagiri"), d("Madurai"), d("Mayiladuthurai"), d("Nagapattinam"),
  d("Namakkal"), d("Nilgiris", "Udhagamandalam"), d("Perambalur"), d("Pudukkottai"),
  d("Ramanathapuram"), d("Ranipet"), d("Salem"), d("Sivaganga"), d("Tenkasi"),
  d("Thanjavur"), d("Theni"), d("Thoothukudi"), d("Tiruchirappalli", "Trichy"),
  d("Tirunelveli"), d("Tirupathur"), d("Tiruppur"), d("Tiruvallur"),
  d("Tiruvannamalai"), d("Tiruvarur"), d("Vellore"), d("Viluppuram"),
  d("Virudhunagar"),
]);

const karnataka = state("KA", "Karnataka", [
  d("Bagalkot"), d("Ballari", "Bellary"), d("Belagavi", "Belgaum"),
  d("Bengaluru Rural", "Devanahalli"), d("Bengaluru Urban", "Bengaluru"), d("Bidar"),
  d("Chamarajanagar"), d("Chikkaballapur"), d("Chikkamagaluru"), d("Chitradurga"),
  d("Dakshina Kannada", "Mangaluru"), d("Davanagere"), d("Dharwad", "Hubballi"),
  d("Gadag"), d("Hassan"), d("Haveri"), d("Kalaburagi", "Gulbarga"),
  d("Kodagu", "Madikeri"), d("Kolar"), d("Koppal"), d("Mandya"), d("Mysuru"),
  d("Raichur"), d("Ramanagara"), d("Shivamogga"), d("Tumakuru"), d("Udupi"),
  d("Uttara Kannada", "Karwar"), d("Vijayapura", "Bijapur"), d("Yadgir"),
  d("Vijayanagara", "Hosapete"),
]);

const kerala = state("KL", "Kerala", [
  d("Alappuzha"), d("Ernakulam", "Kochi"), d("Idukki", "Painavu"), d("Kannur"),
  d("Kasaragod"), d("Kollam"), d("Kottayam"), d("Kozhikode", "Calicut"),
  d("Malappuram"), d("Palakkad"), d("Pathanamthitta"), d("Thiruvananthapuram"),
  d("Thrissur"), d("Wayanad", "Kalpetta"),
]);

export const southStates: StateSeed[] = [
  tamilNadu, karnataka, kerala, ...southExtraStates,
];
