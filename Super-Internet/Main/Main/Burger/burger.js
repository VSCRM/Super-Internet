document.addEventListener('DOMContentLoaded', () => {
		const hamburgerMenu = document.getElementById('hamburger-menu');
		const mainMenu = document.querySelector('.main-menu');

		if (hamburgerMenu && mainMenu) {
				hamburgerMenu.addEventListener('click', () => {
						hamburgerMenu.classList.toggle('active');
						mainMenu.classList.toggle('active');
				});
		}
});
