import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import * as A from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import * as F from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
const fb = initializeApp(firebaseConfig);
export const auth = A.getAuth(fb), db = F.getFirestore(fb);
export { A, F };
