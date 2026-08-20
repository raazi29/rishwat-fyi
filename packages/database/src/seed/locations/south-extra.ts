import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";

const andhra = state("AP", "Andhra Pradesh", [
  d("Alluri Sitharama Raju", "Paderu"), d("Anakapalli"), d("Ananthapuramu", "Anantapur"),
  d("Annamayya", "Rayachoti"), d("Bapatla"), d("Chittoor"),
  d("Dr. B.R. Ambedkar Konaseema", "Amalapuram"), d("East Godavari", "Rajahmundry"),
  d("Eluru"), d("Guntur"), d("Kakinada"), d("Krishna", "Machilipatnam"), d("Kurnool"),
  d("Nandyal"), d("NTR", "Vijayawada"), d("Palnadu", "Narasaraopet"),
  d("Parvathipuram Manyam", "Parvathipuram"), d("Prakasam", "Ongole"),
  d("Sri Potti Sriramulu Nellore", "Nellore"), d("Sri Sathya Sai", "Puttaparthi"),
  d("Srikakulam"), d("Tirupati"), d("Visakhapatnam"), d("Vizianagaram"),
  d("West Godavari", "Bhimavaram"), d("YSR Kadapa", "Kadapa"),
]);

const telangana = state("TG", "Telangana", [
  d("Adilabad"), d("Bhadradri Kothagudem", "Kothagudem"), d("Hanumakonda"),
  d("Hyderabad"), d("Jagtial"), d("Jangaon"), d("Jayashankar Bhupalpally", "Bhupalpally"),
  d("Jogulamba Gadwal", "Gadwal"), d("Kamareddy"), d("Karimnagar"), d("Khammam"),
  d("Komaram Bheem Asifabad", "Asifabad"), d("Mahabubabad"), d("Mahabubnagar"),
  d("Mancherial"), d("Medak"), d("Medchal-Malkajgiri", "Medchal"), d("Mulugu"),
  d("Nagarkurnool"), d("Nalgonda"), d("Narayanpet"), d("Nirmal"), d("Nizamabad"),
  d("Peddapalli"), d("Rajanna Sircilla", "Sircilla"), d("Rangareddy", "Shamshabad"),
  d("Sangareddy"), d("Siddipet"), d("Suryapet"), d("Vikarabad"), d("Wanaparthy"),
  d("Warangal"), d("Yadadri Bhuvanagiri", "Bhongir"),
]);

const puducherry = state("PY", "Puducherry", [
  d("Puducherry"), d("Karaikal"), d("Mahe"), d("Yanam"),
]);

const lakshadweep = state("LD", "Lakshadweep", [d("Lakshadweep", "Kavaratti")]);

const andaman = state("AN", "Andaman and Nicobar Islands", [
  d("Nicobar", "Car Nicobar"), d("North and Middle Andaman", "Mayabunder"),
  d("South Andaman", "Port Blair"),
]);

export const southExtraStates: StateSeed[] = [
  andhra, telangana, puducherry, lakshadweep, andaman,
];
