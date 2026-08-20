import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";

const assam = state("AS", "Assam", [
  d("Baksa", "Mushalpur"), d("Bajali", "Pathsala"), d("Barpeta"),
  d("Biswanath", "Biswanath Chariali"), d("Bongaigaon"), d("Cachar", "Silchar"),
  d("Charaideo", "Sonari"), d("Chirang", "Kajalgaon"), d("Darrang", "Mangaldoi"),
  d("Dhemaji"), d("Dhubri"), d("Dibrugarh"), d("Dima Hasao", "Haflong"),
  d("Goalpara"), d("Golaghat"), d("Hailakandi"), d("Hojai"), d("Jorhat"),
  d("Kamrup", "Amingaon"), d("Kamrup Metropolitan", "Guwahati"),
  d("Karbi Anglong", "Diphu"), d("Karimganj"), d("Kokrajhar"), d("Lakhimpur", "North Lakhimpur"),
  d("Majuli"), d("Morigaon"), d("Nagaon"), d("Nalbari"), d("Sivasagar"),
  d("Sonitpur", "Tezpur"), d("South Salmara-Mankachar", "Hatsingimari"),
  d("Tamulpur"), d("Tinsukia"), d("Udalguri"), d("West Karbi Anglong", "Hamren"),
]);

const arunachal = state("AR", "Arunachal Pradesh", [
  d("Anjaw", "Hawai"), d("Changlang"), d("Dibang Valley", "Anini"),
  d("East Kameng", "Seppa"), d("East Siang", "Pasighat"), d("Kamle", "Raga"),
  d("Kra Daadi", "Palin"), d("Kurung Kumey", "Koloriang"), d("Lepa Rada", "Basar"),
  d("Lohit", "Tezu"), d("Longding"), d("Lower Dibang Valley", "Roing"),
  d("Lower Siang", "Likabali"), d("Lower Subansiri", "Ziro"), d("Namsai"),
  d("Pakke-Kessang", "Lemmi"), d("Papum Pare", "Yupia"), d("Shi Yomi", "Tato"),
  d("Siang", "Boleng"), d("Tawang"), d("Tirap", "Khonsa"),
  d("Upper Siang", "Yingkiong"), d("Upper Subansiri", "Daporijo"),
  d("West Kameng", "Bomdila"), d("West Siang", "Aalo"),
  d("Capital Complex Itanagar", "Itanagar"),
]);

export const eastNeStates: StateSeed[] = [assam, arunachal];
