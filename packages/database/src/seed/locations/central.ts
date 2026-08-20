import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";

const madhyaPradesh = state("MP", "Madhya Pradesh", [
  d("Agar Malwa", "Agar"), d("Alirajpur"), d("Anuppur"), d("Ashoknagar"),
  d("Balaghat"), d("Barwani"), d("Betul"), d("Bhind"), d("Bhopal"), d("Burhanpur"),
  d("Chhatarpur"), d("Chhindwara"), d("Damoh"), d("Datia"), d("Dewas"), d("Dhar"),
  d("Dindori"), d("Guna"), d("Gwalior"), d("Harda"), d("Narmadapuram", "Hoshangabad"),
  d("Indore"), d("Jabalpur"), d("Jhabua"), d("Katni"), d("Khandwa"), d("Khargone"),
  d("Mandla"), d("Mandsaur"), d("Morena"), d("Narsinghpur"), d("Neemuch"),
  d("Niwari"), d("Panna"), d("Raisen"), d("Rajgarh"), d("Ratlam"), d("Rewa"),
  d("Sagar"), d("Satna"), d("Sehore"), d("Seoni"), d("Shahdol"), d("Shajapur"),
  d("Sheopur"), d("Shivpuri"), d("Sidhi"), d("Singrauli"), d("Tikamgarh"),
  d("Ujjain"), d("Umaria"), d("Vidisha"),
]);

const chhattisgarh = state("CT", "Chhattisgarh", [
  d("Balod"), d("Baloda Bazar"), d("Balrampur", "Ramanujganj"), d("Bastar", "Jagdalpur"),
  d("Bemetara"), d("Bijapur"), d("Bilaspur"), d("Dantewada"), d("Dhamtari"),
  d("Durg"), d("Gariaband"), d("Gaurela-Pendra-Marwahi", "Gaurela"),
  d("Janjgir-Champa", "Janjgir"), d("Jashpur"), d("Kabirdham", "Kawardha"),
  d("Kanker"), d("Kondagaon"), d("Korba"), d("Koriya", "Baikunthpur"),
  d("Mahasamund"), d("Mungeli"), d("Narayanpur"), d("Raigarh"), d("Raipur"),
  d("Rajnandgaon"), d("Sukma"), d("Surajpur"), d("Surguja", "Ambikapur"),
  d("Mohla-Manpur-Ambagarh Chowki", "Mohla"), d("Sarangarh-Bilaigarh", "Sarangarh"),
  d("Manendragarh-Chirmiri-Bharatpur", "Manendragarh"),
  d("Khairagarh-Chhuikhadan-Gandai", "Khairagarh"), d("Sakti"),
]);

export const centralStates: StateSeed[] = [madhyaPradesh, chhattisgarh];
