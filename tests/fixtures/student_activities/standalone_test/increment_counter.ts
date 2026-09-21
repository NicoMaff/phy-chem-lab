import './style.css';

const incrementButton = document.querySelector<HTMLButtonElement>('#increment');
const counter = document.querySelector<HTMLElement>('#counter');

if (incrementButton === null || counter === null) {
  throw new Error('Les contrôles de l’activité de test sont introuvables.');
}

let count = 0;

incrementButton.addEventListener('click', () => {
  count += 1;
  counter.textContent = `Compteur : ${count}`;
});
