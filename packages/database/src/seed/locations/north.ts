import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";
import { uttarPradesh } from "./north-up.js";

const delhi = state("DL", "Delhi", [
  d("New Delhi", "New Delhi"),
  d("Central Delhi", "Daryaganj"),
  d("North Delhi", "Delhi"),
  d("North West Delhi", "Rohini"),
  d("West Delhi", "Rajouri Garden"),
  d("South West Delhi", "Dwarka"),
  d("South Delhi", "Saket"),
  d("South East Delhi", "Defence Colony"),
  d("North East Delhi", "Seelampur"),
  d("East Delhi", "Preet Vihar"),
  d("Shahdara", "Shahdara"),
]);

const punjab = state("PB", "Punjab", [
  d("Amritsar"), d("Barnala"), d("Bathinda"), d("Faridkot"), d("Fatehgarh Sahib"),
  d("Fazilka"), d("Firozpur", "Ferozepur"), d("Gurdaspur"), d("Hoshiarpur"),
  d("Jalandhar"), d("Kapurthala"), d("Ludhiana"), d("Malerkotla"), d("Mansa"),
  d("Moga"), d("Sri Muktsar Sahib", "Muktsar"), d("Pathankot"), d("Patiala"),
  d("Rupnagar", "Ropar"), d("Sahibzada Ajit Singh Nagar", "Mohali"), d("Sangrur"),
  d("Shahid Bhagat Singh Nagar", "Nawanshahr"), d("Tarn Taran"),
]);

const haryana = state("HR", "Haryana", [
  d("Ambala"), d("Bhiwani"), d("Charkhi Dadri"), d("Faridabad"), d("Fatehabad"),
  d("Gurugram", "Gurugram", "Gurgaon"), d("Hisar"), d("Jhajjar"), d("Jind"),
  d("Kaithal"), d("Karnal"), d("Kurukshetra"), d("Mahendragarh", "Narnaul"),
  d("Nuh"), d("Palwal"), d("Panchkula"), d("Panipat"), d("Rewari"), d("Rohtak"),
  d("Sirsa"), d("Sonipat"), d("Yamunanagar"),
]);

const himachal = state("HP", "Himachal Pradesh", [
  d("Bilaspur"), d("Chamba"), d("Hamirpur"), d("Kangra", "Dharamshala"),
  d("Kinnaur", "Reckong Peo"), d("Kullu"), d("Lahaul and Spiti", "Keylong"),
  d("Mandi"), d("Shimla"), d("Sirmaur", "Nahan"), d("Solan"), d("Una"),
]);

const uttarakhand = state("UT", "Uttarakhand", [
  d("Almora"), d("Bageshwar"), d("Chamoli", "Gopeshwar"), d("Champawat"),
  d("Dehradun"), d("Haridwar"), d("Nainital"), d("Pauri Garhwal", "Pauri"),
  d("Pithoragarh"), d("Rudraprayag"), d("Tehri Garhwal", "New Tehri"),
  d("Udham Singh Nagar", "Rudrapur"), d("Uttarkashi"),
]);

const jammuKashmir = state("JK", "Jammu and Kashmir", [
  d("Anantnag"), d("Bandipora"), d("Baramulla"), d("Budgam"), d("Doda"),
  d("Ganderbal"), d("Jammu"), d("Kathua"), d("Kishtwar"), d("Kulgam"),
  d("Kupwara"), d("Poonch"), d("Pulwama"), d("Rajouri"), d("Ramban"),
  d("Reasi"), d("Samba"), d("Shopian"), d("Srinagar"), d("Udhampur"),
]);

const ladakh = state("LA", "Ladakh", [d("Kargil"), d("Leh")]);

const chandigarh = state("CH", "Chandigarh", [d("Chandigarh")]);

export const northStates: StateSeed[] = [
  delhi, punjab, haryana, himachal, uttarakhand,
  jammuKashmir, ladakh, chandigarh, uttarPradesh,
];
