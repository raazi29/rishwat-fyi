import type { StateSeed } from "../types.js";
import { d, state } from "./util.js";
import { eastNeStates } from "./east-ne.js";
import { eastNe2States } from "./east-ne2.js";

const westBengal = state("WB", "West Bengal", [
  d("Alipurduar"), d("Bankura"), d("Birbhum", "Suri"), d("Cooch Behar"),
  d("Dakshin Dinajpur", "Balurghat"), d("Darjeeling"), d("Hooghly", "Chinsurah"),
  d("Howrah"), d("Jalpaiguri"), d("Jhargram"), d("Kalimpong"), d("Kolkata"),
  d("Malda", "English Bazar"), d("Murshidabad", "Baharampur"), d("Nadia", "Krishnanagar"),
  d("North 24 Parganas", "Barasat"), d("Paschim Bardhaman", "Asansol"),
  d("Paschim Medinipur", "Medinipur"), d("Purba Bardhaman", "Bardhaman"),
  d("Purba Medinipur", "Tamluk"), d("Purulia"), d("South 24 Parganas", "Alipore"),
  d("Uttar Dinajpur", "Raiganj"),
]);

const bihar = state("BR", "Bihar", [
  d("Araria"), d("Arwal"), d("Aurangabad"), d("Banka"), d("Begusarai"),
  d("Bhagalpur"), d("Bhojpur", "Arrah"), d("Buxar"), d("Darbhanga"),
  d("East Champaran", "Motihari"), d("Gaya"), d("Gopalganj"), d("Jamui"),
  d("Jehanabad"), d("Kaimur", "Bhabua"), d("Katihar"), d("Khagaria"),
  d("Kishanganj"), d("Lakhisarai"), d("Madhepura"), d("Madhubani"), d("Munger"),
  d("Muzaffarpur"), d("Nalanda", "Bihar Sharif"), d("Nawada"), d("Patna"),
  d("Purnia"), d("Rohtas", "Sasaram"), d("Saharsa"), d("Samastipur"),
  d("Saran", "Chhapra"), d("Sheikhpura"), d("Sheohar"), d("Sitamarhi"),
  d("Siwan"), d("Supaul"), d("Vaishali", "Hajipur"), d("West Champaran", "Bettiah"),
]);

const jharkhand = state("JH", "Jharkhand", [
  d("Bokaro"), d("Chatra"), d("Deoghar"), d("Dhanbad"), d("Dumka"),
  d("East Singhbhum", "Jamshedpur"), d("Garhwa"), d("Giridih"), d("Godda"),
  d("Gumla"), d("Hazaribagh"), d("Jamtara"), d("Khunti"), d("Koderma"),
  d("Latehar"), d("Lohardaga"), d("Pakur"), d("Palamu", "Daltonganj"), d("Ramgarh"),
  d("Ranchi"), d("Sahibganj"), d("Seraikela Kharsawan", "Seraikela"), d("Simdega"),
  d("West Singhbhum", "Chaibasa"),
]);

const odisha = state("OR", "Odisha", [
  d("Angul"), d("Balangir"), d("Balasore", "Baleswar"), d("Bargarh"), d("Bhadrak"),
  d("Boudh"), d("Cuttack"), d("Deogarh"), d("Dhenkanal"), d("Gajapati", "Paralakhemundi"),
  d("Ganjam", "Chhatrapur"), d("Jagatsinghpur"), d("Jajpur"), d("Jharsuguda"),
  d("Kalahandi", "Bhawanipatna"), d("Kandhamal", "Phulbani"), d("Kendrapara"),
  d("Kendujhar", "Keonjhar"), d("Khordha", "Bhubaneswar"), d("Koraput"),
  d("Malkangiri"), d("Mayurbhanj", "Baripada"), d("Nabarangpur"), d("Nayagarh"),
  d("Nuapada"), d("Puri"), d("Rayagada"), d("Sambalpur"), d("Subarnapur", "Sonepur"),
  d("Sundargarh"),
]);

export const eastStates: StateSeed[] = [
  westBengal, bihar, jharkhand, odisha, ...eastNeStates, ...eastNe2States,
];
