import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";

const maharashtra = state("MH", "Maharashtra", [
  d("Ahmednagar"), d("Akola"), d("Amravati"), d("Chhatrapati Sambhajinagar", "Aurangabad"),
  d("Beed"), d("Bhandara"), d("Buldhana"), d("Chandrapur"), d("Dhule"),
  d("Gadchiroli"), d("Gondia"), d("Hingoli"), d("Jalgaon"), d("Jalna"),
  d("Kolhapur"), d("Latur"), d("Mumbai City", "Mumbai"), d("Mumbai Suburban", "Bandra"),
  d("Nagpur"), d("Nanded"), d("Nandurbar"), d("Nashik"), d("Dharashiv", "Osmanabad"),
  d("Palghar"), d("Parbhani"), d("Pune"), d("Raigad", "Alibag"), d("Ratnagiri"),
  d("Sangli"), d("Satara"), d("Sindhudurg", "Oros"), d("Solapur"), d("Thane"),
  d("Wardha"), d("Washim"), d("Yavatmal"),
]);

const gujarat = state("GJ", "Gujarat", [
  d("Ahmedabad"), d("Amreli"), d("Anand"), d("Aravalli", "Modasa"),
  d("Banaskantha", "Palanpur"), d("Bharuch"), d("Bhavnagar"), d("Botad"),
  d("Chhota Udaipur"), d("Dahod"), d("Dang", "Ahwa"), d("Devbhoomi Dwarka", "Khambhalia"),
  d("Gandhinagar"), d("Gir Somnath", "Veraval"), d("Jamnagar"), d("Junagadh"),
  d("Kheda", "Nadiad"), d("Kutch", "Bhuj"), d("Mahisagar", "Lunawada"), d("Mehsana"),
  d("Morbi"), d("Narmada", "Rajpipla"), d("Navsari"), d("Panchmahal", "Godhra"),
  d("Patan"), d("Porbandar"), d("Rajkot"), d("Sabarkantha", "Himatnagar"),
  d("Surat"), d("Surendranagar"), d("Tapi", "Vyara"), d("Vadodara"), d("Valsad"),
]);

const rajasthan = state("RJ", "Rajasthan", [
  d("Ajmer"), d("Alwar"), d("Banswara"), d("Baran"), d("Barmer"), d("Bharatpur"),
  d("Bhilwara"), d("Bikaner"), d("Bundi"), d("Chittorgarh"), d("Churu"), d("Dausa"),
  d("Dholpur"), d("Dungarpur"), d("Hanumangarh"), d("Jaipur"), d("Jaisalmer"),
  d("Jalore"), d("Jhalawar"), d("Jhunjhunu"), d("Jodhpur"), d("Karauli"), d("Kota"),
  d("Nagaur"), d("Pali"), d("Pratapgarh"), d("Rajsamand"), d("Sawai Madhopur"),
  d("Sikar"), d("Sirohi"), d("Sri Ganganagar"), d("Tonk"), d("Udaipur"),
]);

const goa = state("GA", "Goa", [
  d("North Goa", "Panaji"), d("South Goa", "Margao"),
]);

const dnhdd = state("DH", "Dadra and Nagar Haveli and Daman and Diu", [
  d("Dadra and Nagar Haveli", "Silvassa"), d("Daman"), d("Diu"),
]);

export const westStates: StateSeed[] = [
  maharashtra, gujarat, rajasthan, goa, dnhdd,
];
