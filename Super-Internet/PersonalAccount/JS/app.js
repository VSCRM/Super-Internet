// OOP Classes
class User {
	constructor(email, password, role = 'client') {
		this.email = email;
		this.password = password;
		this.role = role;
		this.id = Date.now() + Math.random();
	}
}

class Client extends User {
	constructor(email, password, phone, fio) {
		super(email, password, 'client');
		this.phone = phone;
		this.fio = fio;
		this.contract = null;
		this.balance = 0;
		this.messages = [];
		this.lastPaymentDate = new Date();
		this.connectionApproved = false;
		this.unreadMessages = 0;
	}

	createContract(serviceType, address) {
		this.contract = new Contract(this.id, this.fio, this.phone, this.email, serviceType, address);
	}
}

class Support extends User {
	constructor(email, password, name) {
		super(email, password, 'support');
		this.name = name;
	}
}

class Admin extends User {
	constructor(email, password) {
		super(email, password, 'admin');
	}
}

class Contract {
	constructor(userId, fio, phone, email, serviceType, address) {
		this.id = 'CNT' + Date.now();
		this.userId = userId;
		this.fio = fio;
		this.phone = phone;
		this.email = email;
		this.address = address || 'Не вказано';
		this.serviceType = serviceType;
		this.equipmentId = 'EQ' + Math.floor(Math.random() * 10000);
		this.status = 'pending';
		this.createdAt = new Date();
	}
}

class ValidationService {
	static validateEmail(email) {
		const emailRegex = /^[^\s@]+@(gmail|ukr|yahoo|outlook|meta)\.(com|ua|net)$/i;
		return emailRegex.test(email);
	}

	static validatePhone(phone) {
		const phoneRegex = /^\+380\d{9}$/;
		return phoneRegex.test(phone);
	}

	static validatePassword(password) {
		return password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password);
	}

	static validateFIO(fio) {
		const words = fio.trim().split(/\s+/);
		if (words.length !== 3) return false;

		const ukrainianRegex = /^[А-ЯІЇЄҐ][а-яіїєґ']+$/;
		return words.every(word => ukrainianRegex.test(word));
	}

	static validateAddress(address) {
		const trimmed = address.trim();
		// Перевіряємо мінімальну довжину
		if (trimmed.length < 15) return false;

		// Перевіряємо наявність українських букв
		const ukrainianRegex = /[а-яіїєґА-ЯІЇЄҐ]/;
		if (!ukrainianRegex.test(trimmed)) return false;

		// Перевіряємо наявність цифр (номер будинку)
		const hasNumbers = /\d/.test(trimmed);
		if (!hasNumbers) return false;

		// Перевіряємо наявність ключових слів (вул., вулиця, пров., проспект тощо)
		const streetKeywords = /(вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|бульв\.?|бульвар|площа|майдан)/i;
		if (!streetKeywords.test(trimmed)) return false;

		return true;
	}
}

class AuthService {
	constructor() {
		this.currentUser = null;
		this.users = this.loadUsers();
		this.initDefaultUsers();
	}

	initDefaultUsers() {
		if (!this.users.find(u => u.email === 'admin@super.net')) {
			const admin = new Admin('admin@super.net', 'admin123');
			this.users.push(admin);
		}
		if (!this.users.find(u => u.email === 'support@super.net')) {
			const support = new Support('support@super.net', 'support123', 'Техпідтримка');
			this.users.push(support);
		}
		this.saveUsers();
	}

	loadUsers() {
		const data = window.localStorage.getItem('superInternetUsers');
		if (!data) return [];

		try {
			const usersData = JSON.parse(data);
			return usersData.map(userData => {
				let user;
				if (userData.role === 'client') {
					user = Object.assign(new Client('', '', '', ''), userData);
				} else if (userData.role === 'support') {
					user = Object.assign(new Support('', '', ''), userData);
				} else if (userData.role === 'admin') {
					user = Object.assign(new Admin('', ''), userData);
				}
				return user;
			});
		} catch (e) {
			return [];
		}
	}

	saveUsers() {
		window.localStorage.setItem('superInternetUsers', JSON.stringify(this.users));
	}

	register(email, password, phone, fio) {
		if (this.users.find(u => u.email === email)) {
			throw new Error('Користувач з таким email вже існує');
		}
		const client = new Client(email, password, phone, fio);
		this.users.push(client);
		this.saveUsers();
		return client;
	}

	login(email, password) {
		const user = this.users.find(u => u.email === email && u.password === password);
		if (!user) {
			throw new Error('Невірний email або пароль');
		}
		this.currentUser = user;
		return user;
	}

	logout() {
		this.currentUser = null;
	}

	updateUser(user) {
		const index = this.users.findIndex(u => u.id === user.id);
		if (index !== -1) {
			this.users[index] = user;
			this.saveUsers();
		}
	}

	getUserById(id) {
		return this.users.find(u => u.id === id);
	}

	deleteUser(userId) {
		this.users = this.users.filter(u => u.id !== userId);
		this.saveUsers();
	}

	getTempCode(email) {
		const user = this.users.find(u => u.email === email);
		if (!user) {
			throw new Error('Користувача з таким email не знайдено');
		}

		const code = Math.floor(100000 + Math.random() * 900000).toString();
		user.tempCode = code;
		user.codeExpiry = Date.now() + 5 * 60 * 1000;
		this.updateUser(user);

		console.log(`[AUTH SERVICE MOCK] Код відновлення для ${email}: ${code}`);
		return code;
	}

	verifyCode(email, code) {
		const user = this.users.find(u => u.email === email);
		if (!user || user.tempCode !== code || Date.now() > user.codeExpiry) {
			throw new Error('Невірний або прострочений код');
		}
		return true;
	}

	resetPassword(email, newPassword) {
		const user = this.users.find(u => u.email === email);
		if (!user) {
			throw new Error('Користувача не знайдено');
		}

		if (!ValidationService.validatePassword(newPassword)) {
			throw new Error('Пароль має містити мінімум 6 символів та хоча б 1 цифру');
		}

		user.password = newPassword;
		user.tempCode = null;
		user.codeExpiry = null;
		this.updateUser(user);
		return true;
	}
}

class ModalService {
	static show(title, message, type = 'info') {
		const modal = document.createElement('div');
		modal.className = 'modal-overlay';
		modal.innerHTML = `
			<div class="modal-content ${type}">
				<h3>${title}</h3>
				<p>${message}</p>
				<button class="modal-btn">ОК</button>
			</div>
		`;
		document.body.appendChild(modal);

		setTimeout(() => modal.classList.add('show'), 10);

		modal.querySelector('.modal-btn').addEventListener('click', () => {
			modal.classList.remove('show');
			setTimeout(() => modal.remove(), 300);
		});
	}

	static prompt(title, message, placeholder = '') {
		return new Promise((resolve) => {
			const modal = document.createElement('div');
			modal.className = 'modal-overlay';
			modal.innerHTML = `
				<div class="modal-content">
					<h3>${title}</h3>
					<p>${message}</p>
					<input type="text" class="modal-input" placeholder="${placeholder}">
					<div style="display: flex; gap: 1rem; margin-top: 1rem;">
						<button class="modal-btn cancel">Скасувати</button>
						<button class="modal-btn confirm">Підтвердити</button>
					</div>
				</div>
			`;
			document.body.appendChild(modal);

			setTimeout(() => modal.classList.add('show'), 10);

			const input = modal.querySelector('.modal-input');
			input.focus();

			modal.querySelector('.cancel').addEventListener('click', () => {
				modal.classList.remove('show');
				setTimeout(() => modal.remove(), 300);
				resolve(null);
			});

			const confirm = () => {
				const value = input.value.trim();
				modal.classList.remove('show');
				setTimeout(() => modal.remove(), 300);
				resolve(value);
			};

			modal.querySelector('.confirm').addEventListener('click', confirm);
			input.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') confirm();
			});
		});
	}

	static confirm(title, message) {
		return new Promise((resolve) => {
			const modal = document.createElement('div');
			modal.className = 'modal-overlay';
			modal.innerHTML = `
				<div class="modal-content warning">
					<h3>${title}</h3>
					<p>${message}</p>
					<div style="display: flex; gap: 1rem; margin-top: 1rem;">
						<button class="modal-btn cancel">Ні</button>
						<button class="modal-btn confirm">Так</button>
					</div>
				</div>
			`;
			document.body.appendChild(modal);

			setTimeout(() => modal.classList.add('show'), 10);

			modal.querySelector('.cancel').addEventListener('click', () => {
				modal.classList.remove('show');
				setTimeout(() => modal.remove(), 300);
				resolve(false);
			});

			modal.querySelector('.confirm').addEventListener('click', () => {
				modal.classList.remove('show');
				setTimeout(() => modal.remove(), 300);
				resolve(true);
			});
		});
	}
}

class UIController {
	constructor(authService) {
		this.authService = authService;
		this.currentChatClient = null;
		this.initEventListeners();
	}

	initEventListeners() {
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
		});

		document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
		document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
		document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

		document.querySelectorAll('.nav-tab').forEach(tab => {
			tab.addEventListener('click', (e) => this.switchDashboardTab(e.target.dataset.content));
		});

		document.querySelectorAll('.service-option').forEach(option => {
			option.addEventListener('click', (e) => this.selectService(e.currentTarget.dataset.service));
		});

		document.getElementById('forgotPasswordBtn').addEventListener('click', () => this.handleForgotPassword());

		// Real-time validation
		const regEmail = document.getElementById('regEmail');
		const regPhone = document.getElementById('regPhone');
		const regFIO = document.getElementById('regFIO');
		const regPassword = document.getElementById('regPassword');
		const regPasswordConfirm = document.getElementById('regPasswordConfirm');

		regEmail.addEventListener('input', () => this.validateInput(regEmail, ValidationService.validateEmail));
		regPhone.addEventListener('input', () => this.validateInput(regPhone, ValidationService.validatePhone));
		regFIO.addEventListener('input', () => this.validateInput(regFIO, ValidationService.validateFIO));
		regPassword.addEventListener('input', () => {
			this.validateInput(regPassword, ValidationService.validatePassword);
			if (regPasswordConfirm.value) {
				this.validatePasswordMatch(regPassword, regPasswordConfirm);
			}
		});
		regPasswordConfirm.addEventListener('input', () => this.validatePasswordMatch(regPassword, regPasswordConfirm));
	}

	switchAuthTab(tab) {
		document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
		document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

		document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
		document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
	}

	validateInput(input, validator) {
		const value = input.value;
		const errorElement = input.nextElementSibling;

		if (value && !validator(value)) {
			input.classList.add('error');
			input.classList.remove('success');
			errorElement.classList.add('show');
			return false;
		} else if (value && validator(value)) {
			input.classList.remove('error');
			input.classList.add('success');
			errorElement.classList.remove('show');
			return true;
		} else {
			input.classList.remove('error', 'success');
			errorElement.classList.remove('show');
			return false;
		}
	}

	validatePasswordMatch(password, passwordConfirm) {
		const errorElement = passwordConfirm.nextElementSibling;

		if (password.value !== passwordConfirm.value) {
			passwordConfirm.classList.add('error');
			passwordConfirm.classList.remove('success');
			errorElement.classList.add('show');
			return false;
		} else {
			passwordConfirm.classList.remove('error');
			passwordConfirm.classList.add('success');
			errorElement.classList.remove('show');
			return true;
		}
	}

	async handleRegister(e) {
		e.preventDefault();

		const email = document.getElementById('regEmail');
		const phone = document.getElementById('regPhone');
		const fio = document.getElementById('regFIO');
		const password = document.getElementById('regPassword');
		const passwordConfirm = document.getElementById('regPasswordConfirm');

		const isEmailValid = this.validateInput(email, ValidationService.validateEmail);
		const isPhoneValid = this.validateInput(phone, ValidationService.validatePhone);
		const isFIOValid = this.validateInput(fio, ValidationService.validateFIO);
		const isPasswordValid = this.validateInput(password, ValidationService.validatePassword);
		const isPasswordMatch = this.validatePasswordMatch(password, passwordConfirm);

		if (isEmailValid && isPhoneValid && isFIOValid && isPasswordValid && isPasswordMatch) {
			try {
				const client = this.authService.register(
					email.value,
					password.value,
					phone.value,
					fio.value
				);
				this.authService.currentUser = client;
				await ModalService.show('Успіх', 'Реєстрацію завершено! Тепер оберіть послугу.', 'success');
				this.showDashboard();

				email.value = '';
				phone.value = '';
				fio.value = '';
				password.value = '';
				passwordConfirm.value = '';


				[email, phone, fio, password, passwordConfirm].forEach(input => {
					input.classList.remove('success', 'error');

					const errorElement = input.nextElementSibling;
					if (errorElement) errorElement.classList.remove('show');
				});


			} catch (error) {
				ModalService.show('Помилка', error.message, 'error');
			}
		}
	}

	async handleLogin(e) {
		e.preventDefault();

		const email = document.getElementById('loginEmail').value;
		const password = document.getElementById('loginPassword').value;

		try {
			const user = this.authService.login(email, password);
			this.showDashboard();
		} catch (error) {
			ModalService.show('Помилка', error.message, 'error');
		}
	}

	handleLogout() {
		this.authService.logout();
		document.getElementById('authContainer').classList.remove('hidden');
		document.getElementById('dashboard').classList.add('hidden');

		document.getElementById('clientDashboard').classList.add('hidden');
		document.getElementById('supportDashboard').classList.add('hidden');
		document.getElementById('adminDashboard').classList.add('hidden');
	}

	showDashboard() {
		document.getElementById('authContainer').classList.add('hidden');
		document.getElementById('dashboard').classList.remove('hidden');

		const user = this.authService.currentUser;
		document.getElementById('userName').textContent = user.fio || user.name || user.email;
		document.getElementById('userRole').textContent = `(${user.role === 'client' ? 'Клієнт' : user.role === 'support' ? 'Підтримка' : 'Адміністратор'})`;

		if (user.role === 'client') {
			this.showClientDashboard(user);
		} else if (user.role === 'support') {
			this.showSupportDashboard();
		} else if (user.role === 'admin') {
			this.showAdminDashboard();
		}
	}

	showClientDashboard(client) {
		document.getElementById('clientDashboard').classList.remove('hidden');
		document.getElementById('supportDashboard').classList.add('hidden');
		document.getElementById('adminDashboard').classList.add('hidden');

		if (!client.contract) {
			document.getElementById('serviceSelection').classList.remove('hidden');
			document.getElementById('serviceStatus').classList.add('hidden');
		} else {
			document.getElementById('serviceSelection').classList.add('hidden');
			document.getElementById('serviceStatus').classList.remove('hidden');
			this.updateServiceStatus(client);
			this.updateRecurringStatus(client);
		}
		this.updateContract(client);
		this.checkUnreadMessages(client);
		this.loadClientChatMessages(client);
	}

	loadClientChatMessages(client) {
		const chatMessages = document.getElementById('chatMessages');
		if (!chatMessages) return;

		chatMessages.innerHTML = '';

		if (!client.messages || client.messages.length === 0) {
			chatMessages.innerHTML = '<p style="text-align: center; color: var(--gray-color);">Поки що немає повідомлень</p>';
			return;
		}

		client.messages.forEach(msg => {
			const msgDiv = document.createElement('div');
			msgDiv.className = `message ${msg.from === client.email ? 'user' : 'support'}`;
			msgDiv.innerHTML = `
				<small>${new Date(msg.timestamp).toLocaleString('uk-UA')}</small><br>
				${msg.text}
			`;
			chatMessages.appendChild(msgDiv);
		});

		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	checkUnreadMessages(client) {
		if (!client.messages) return;

		const unread = client.messages.filter(m => m.from === 'support' && !m.read).length;
		client.unreadMessages = unread;

		const supportTab = document.querySelector('[data-content="support"]');
		if (supportTab) {
			let badge = supportTab.querySelector('.unread-badge');
			if (unread > 0) {
				if (!badge) {
					badge = document.createElement('span');
					badge.className = 'unread-badge';
					supportTab.appendChild(badge);
				}
				badge.textContent = unread;
			} else if (badge) {
				badge.remove();
			}
		}
	}

	async selectService(serviceType) {
		const client = this.authService.currentUser;

		const address = await ModalService.prompt(
			'Адреса підключення',
			'Введіть вашу повну адресу (вулиця, номер будинку, квартира):',
			'вул. Івана Франка, 25, кв. 10'
		);

		if (!address) return;

		if (!ValidationService.validateAddress(address)) {
			ModalService.show('Помилка', 'Введіть коректну адресу українською мовою у форматі: вул./пров./просп. Назва, номер будинку, кв. номер\n\nПриклад: вул. Івана Франка, 25, кв. 10', 'error');
			return;
		}

		client.createContract(serviceType, address);
		this.authService.saveUsers();

		await ModalService.show(
			'Заявка прийнята',
			`Послугу успішно обрано!\n\nВаша адреса: ${address}\n\nОчікуйте підтвердження підключення від адміністратора. Після підключення кабелю від вул. Січових Стрільців, 15 до вашої адреси та перевірки даних, ви зможете активувати послугу.`,
			'success'
		);

		this.showClientDashboard(client);
	}

	updateServiceStatus(client) {
		const serviceNames = {
			'internet': 'Інтернет',
			'internet_tv': 'Інтернет + Телебачення'
		};

		document.getElementById('currentService').textContent = serviceNames[client.contract.serviceType];
		document.getElementById('balance').textContent = client.balance.toFixed(2) + ' грн';

		const statusBadge = document.getElementById('serviceStatusBadge');

		if (!client.connectionApproved) {
			statusBadge.innerHTML = '<span class="status-badge status-pending">Очікує підключення</span>';
		} else if (client.balance >= 0) {
			statusBadge.innerHTML = '<span class="status-badge status-active">Активна</span>';
		} else {
			statusBadge.innerHTML = '<span class="status-badge status-debt">Заборгованість</span>';
		}

		const nextDate = new Date();
		nextDate.setMonth(nextDate.getMonth() + 1);
		document.getElementById('nextPayment').textContent = nextDate.toLocaleDateString('uk-UA');
	}

	updateContract(client) {
		if (client.contract) {
			document.getElementById('contractId').textContent = client.contract.id;
			document.getElementById('contractFIO').textContent = client.contract.fio;
			document.getElementById('contractPhone').textContent = client.contract.phone;
			document.getElementById('contractEmail').textContent = client.contract.email;
			document.getElementById('contractAddress').textContent = client.contract.address;

			const serviceNames = {
				'internet': 'Інтернет',
				'internet_tv': 'Інтернет + Телебачення'
			};
			document.getElementById('contractService').textContent = serviceNames[client.contract.serviceType];
			document.getElementById('contractEquipment').textContent = client.contract.equipmentId;

			let statusText = '';
			if (!client.connectionApproved) {
				statusText = '<span class="status-badge status-pending">Очікує підключення</span>';
			} else if (client.contract.status === 'active') {
				statusText = '<span class="status-badge status-active">Активний</span>';
			} else {
				statusText = '<span class="status-badge status-debt">Борг</span>';
			}
			document.getElementById('contractStatus').innerHTML = statusText;

			const contractActions = document.getElementById('contractActions');
			if (contractActions) {
				contractActions.innerHTML = `
					<button class="submit-btn" id="editContractBtn" style="margin-top: 1rem;">Редагувати договір</button>
					<button class="logout-btn" id="deleteContractBtn" style="margin-top: 0.5rem;">Видалити договір</button>
					<button class="logout-btn" id="deleteAccountBtn" style="margin-top: 0.5rem; background: #d32f2f;">Видалити акаунт</button>
				`;

				document.getElementById('editContractBtn').addEventListener('click', () => this.handleEditContract(client));
				document.getElementById('deleteContractBtn').addEventListener('click', () => this.handleDeleteContract(client));
				document.getElementById('deleteAccountBtn').addEventListener('click', () => this.handleDeleteAccount(client));
			}
		} else {
			document.getElementById('contractId').textContent = '';
			document.getElementById('contractFIO').textContent = '';
			document.getElementById('contractPhone').textContent = '';
			document.getElementById('contractEmail').textContent = '';
			document.getElementById('contractAddress').textContent = '';
			document.getElementById('contractService').textContent = '';
			document.getElementById('contractEquipment').textContent = '';
			document.getElementById('contractStatus').innerHTML = '<span class="status-badge status-pending">Немає договору</span>';
			document.getElementById('contractActions').innerHTML = '';
		}
	}

	async handleEditContract(client) {
		const address = await ModalService.prompt('Редагування договору', 'Введіть нову адресу:', client.contract.address);
		if (!address) return;

		if (!ValidationService.validateAddress(address)) {
			ModalService.show('Помилка', 'Введіть коректну адресу українською мовою у форматі: вул./пров./просп. Назва, номер будинку, кв. номер', 'error');
			return;
		}

		client.contract.address = address;
		this.authService.updateUser(client);
		this.updateContract(client);
		ModalService.show('Успіх', 'Договір оновлено!', 'success');
	}

	async handleDeleteContract(client) {
		const confirmed = await ModalService.confirm(
			'Видалення договору',
			'Ви впевнені, що хочете видалити договір? Ця дія незворотна.'
		);

		if (confirmed) {
			client.contract = null;
			client.connectionApproved = false;
			client.balance = 0;
			client.equipmentStatus = null;
			this.authService.updateUser(client);
			await ModalService.show('Успіх', 'Договір видалено!', 'success');

			this.showClientDashboard(client);
		}
	}

	async handleDeleteAccount(client) {
		const confirmed = await ModalService.confirm(
			'Видалення акаунта',
			'Ви впевнені, що хочете видалити акаунт? Всі дані будуть втрачені назавжди!'
		);

		if (confirmed) {
			this.authService.deleteUser(client.id);
			this.handleLogout();
			ModalService.show('Успіх', 'Акаунт видалено!', 'success');
		}
	}

	switchDashboardTab(content) {
		document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

		event.target.classList.add('active');
		document.getElementById(content + 'Content').classList.add('active');

		if (content === 'support') {
			const client = this.authService.currentUser;
			if (client.messages) {
				client.messages.forEach(m => {
					if (m.from === 'support') m.read = true;
				});
				client.unreadMessages = 0;
				this.authService.updateUser(client);
				this.checkUnreadMessages(client);
			}
			this.loadClientChatMessages(client);
		}
	}

	showSupportDashboard() {
		document.getElementById('clientDashboard').classList.add('hidden');
		document.getElementById('supportDashboard').classList.remove('hidden');
		document.getElementById('adminDashboard').classList.add('hidden');
		this.loadTickets();
	}

	loadTickets() {
		const ticketsGrid = document.getElementById('ticketsGrid');
		const users = this.authService.users.filter(u => u.role === 'client' && u.messages && u.messages.length > 0);

		ticketsGrid.innerHTML = '';

		if (users.length === 0) {
			ticketsGrid.innerHTML = '<p style="color: var(--gray-color);">Немає активних звернень</p>';
			return;
		}

		users.forEach(user => {
			const card = document.createElement('div');
			card.className = 'ticket-card';
			card.innerHTML = `
								<h4>${user.fio}</h4>
								<p>Email: ${user.email}</p>
								<p>Телефон: ${user.phone}</p>
								<p>Повідомлень: ${user.messages.length}</p>
								<p class="status-badge status-pending" style="display: inline-block; margin-top: 0.5rem;">Активне</p>
						`;
			card.addEventListener('click', () => this.openSupportChat(user));
			ticketsGrid.appendChild(card);
		});
	}

	openSupportChat(client) {
		this.currentChatClient = client;

		const chatOverlay = document.createElement('div');
		chatOverlay.className = 'chat-overlay';
		chatOverlay.innerHTML = `
			<div class="chat-window">
				<div class="chat-header">
					<div>
						<h3>${client.fio}</h3>
						<p style="font-size: 0.9rem; opacity: 0.8;">${client.email}</p>
					</div>
						<div style="display: flex; gap: 1rem;">
							<button class="view-client-btn">Переглянути профіль</button>
							<button class="close-ticket-btn">Закрити звернення</button>
							<button class="close-chat-btn">✕</button>
						</div>
				</div>
				<div class="chat-messages-area" id="supportChatMessages"></div>
				<div class="chat-input">
					<input type="text" id="supportMessageInput" placeholder="Введіть повідомлення...">
					<button class="submit-btn" style="width: auto; padding: 1rem 2rem" id="supportSendBtn">Надіслати</button>
				</div>
			</div>
		`;

		document.body.appendChild(chatOverlay);
		setTimeout(() => chatOverlay.classList.add('show'), 10);

		this.loadChatMessages(client);

		chatOverlay.querySelector('.close-chat-btn').addEventListener('click', () => {
			chatOverlay.classList.remove('show');
			setTimeout(() => chatOverlay.remove(), 300);
		});

		chatOverlay.querySelector('.view-client-btn').addEventListener('click', () => {
			this.showClientProfile(client);
		});

		chatOverlay.querySelector('.close-ticket-btn').addEventListener('click', async () => {
			const confirmed = await ModalService.confirm(
				'Закриття звернення',
				`Закрити звернення від ${client.fio}? Всі повідомлення будуть видалені.`
			);

			if (confirmed) {
				client.messages = [];
				this.authService.updateUser(client);
				ModalService.show('Успіх', 'Звернення закрито!', 'success');
				chatOverlay.classList.remove('show');
				setTimeout(() => {
					chatOverlay.remove();
					this.loadTickets();
				}, 300);
			}
		});

		const sendBtn = chatOverlay.querySelector('#supportSendBtn');
		const input = chatOverlay.querySelector('#supportMessageInput');

		sendBtn.addEventListener('click', () => this.sendSupportMessage(client));
		input.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') sendBtn.click();
		});
	}

	loadChatMessages(client) {
		const container = document.getElementById('supportChatMessages');
		container.innerHTML = '';

		if (!client.messages || client.messages.length === 0) {
			container.innerHTML = '<p style="text-align: center; color: var(--gray-color);">Поки що немає повідомлень</p>';
			return;
		}

		client.messages.forEach(msg => {
			const msgDiv = document.createElement('div');
			msgDiv.className = `message ${msg.from === client.email ? 'user' : 'support'}`;
			msgDiv.innerHTML = `
				<small>${new Date(msg.timestamp).toLocaleString('uk-UA')}</small><br>
				${msg.text}
			`;
			container.appendChild(msgDiv);
		});

		container.scrollTop = container.scrollHeight;
	}

	sendSupportMessage(client) {
		const input = document.getElementById('supportMessageInput');
		const message = input.value.trim();

		if (!message) return;

		const msg = {
			from: 'support',
			to: client.email,
			text: message,
			timestamp: new Date(),
			read: false
		};

		if (!client.messages) client.messages = [];
		client.messages.push(msg);
		this.authService.updateUser(client);

		input.value = '';
		this.loadChatMessages(client);
	}

	showClientProfile(client) {
		const profileOverlay = document.createElement('div');
		profileOverlay.className = 'modal-overlay';
		profileOverlay.innerHTML = `
			<div class="profile-modal">
				<div class="modal-header">
					<h2>Профіль клієнта</h2>
					<button class="close-modal-btn">✕</button>
				</div>
				
				<div class="profile-tabs">
					<button class="profile-tab active" data-tab="status">Статус послуги</button>
					<button class="profile-tab" data-tab="contract">Договір</button>
				</div>
				
				<div id="profileStatusTab" class="profile-tab-content active">
					<div class="service-card">
						<h3>Поточна послуга</h3>
						${client.contract ? `
							<div class="contract-field">
								<span>Тип послуги:</span>
								<span>${client.contract.serviceType === 'internet' ? 'Інтернет' : 'Інтернет + Телебачення'}</span>
							</div>
							<div class="contract-field">
								<span>Статус:</span>
								<span>${!client.connectionApproved ? '<span class="status-badge status-pending">Очікує підключення</span>' : (client.balance >= 0 ? '<span class="status-badge status-active">Активна</span>' : '<span class="status-badge status-debt">Заборгованість</span>')}</span>
							</div>
							<div class="contract-field">
								<span>Баланс:</span>
								<span>${client.balance.toFixed(2)} грн</span>
							</div>
							<div class="contract-field">
								<span>Адреса:</span>
								<span>${client.contract.address}</span>
							</div>
						` : '<p>Договір не оформлено</p>'}
					</div>
				</div>
				
				<div id="profileContractTab" class="profile-tab-content">
					${client.contract ? `
						<div class="contract-view" style="background: rgba(55, 25, 77, 0.5); color: #fff;">
							<h2 style="text-align: center; margin-bottom: 2rem">Договір №${client.contract.id}</h2>
							<div class="form-group">
								<label>ПІБ:</label>
								<input type="text" id="editFIO" value="${client.contract.fio}">
							</div>
							<div class="form-group">
								<label>Телефон:</label>
								<input type="text" id="editPhone" value="${client.contract.phone}">
							</div>
							<div class="form-group">
								<label>Email:</label>
								<input type="text" id="editEmail" value="${client.contract.email}">
							</div>
							<div class="form-group">
								<label>Адреса:</label>
								<input type="text" id="editAddress" value="${client.contract.address}">
							</div>
							<div class="form-group">
								<label>ID обладнання:</label>
								<input type="text" id="editEquipment" value="${client.contract.equipmentId}">
							</div>
							<button class="submit-btn" id="saveContractBtn">Зберегти зміни</button>
						</div>
					` : '<p style="text-align: center;">Договір не оформлено</p>'}
				</div>
			</div>
		`;

		document.body.appendChild(profileOverlay);
		setTimeout(() => profileOverlay.classList.add('show'), 10);

		profileOverlay.querySelector('.close-modal-btn').addEventListener('click', () => {
			profileOverlay.classList.remove('show');
			setTimeout(() => profileOverlay.remove(), 300);
		});

		profileOverlay.querySelectorAll('.profile-tab').forEach(tab => {
			tab.addEventListener('click', (e) => {
				profileOverlay.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
				profileOverlay.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));

				e.target.classList.add('active');
				const tabName = e.target.dataset.tab;
				profileOverlay.querySelector(`#profile${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
			});
		});

		const saveBtn = profileOverlay.querySelector('#saveContractBtn');
		if (saveBtn) {
			saveBtn.addEventListener('click', async () => {
				client.contract.fio = profileOverlay.querySelector('#editFIO').value;
				client.contract.phone = profileOverlay.querySelector('#editPhone').value;
				client.contract.email = profileOverlay.querySelector('#editEmail').value;
				client.contract.address = profileOverlay.querySelector('#editAddress').value;
				client.contract.equipmentId = profileOverlay.querySelector('#editEquipment').value;

				this.authService.updateUser(client);
				await ModalService.show('Успіх', 'Договір оновлено!', 'success');
				profileOverlay.classList.remove('show');
				setTimeout(() => profileOverlay.remove(), 300);
			});
		}
	}

	showAdminDashboard() {
		document.getElementById('clientDashboard').classList.add('hidden');
		document.getElementById('supportDashboard').classList.add('hidden');
		document.getElementById('adminDashboard').classList.remove('hidden');

		this.loadStaffList();
		this.loadEquipment();
		this.loadClientsList();

		const oldBtn = document.getElementById('addStaffBtn');
		const newBtn = oldBtn.cloneNode(true);
		oldBtn.parentNode.replaceChild(newBtn, oldBtn);

		newBtn.addEventListener('click', () => this.addStaff());
	}

	loadClientsList() {
		const clientsGrid = document.getElementById('clientsListGrid');
		if (!clientsGrid) return;

		const clients = this.authService.users.filter(u => u.role === 'client');

		clientsGrid.innerHTML = '';

		if (clients.length === 0) {
			clientsGrid.innerHTML = '<p style="grid-column: 1/-1; color: var(--gray-color);">Немає зареєстрованих клієнтів</p>';
			return;
		}

		clients.forEach(client => {
			const card = document.createElement('div');
			card.className = 'ticket-card';
			card.innerHTML = `
				<h4>${client.fio}</h4>
				<p>Email: ${client.email}</p>
				<p>Телефон: ${client.phone}</p>
				<p>Баланс: ${client.balance.toFixed(2)} грн</p>
				${client.contract ? `<p class="status-badge ${client.connectionApproved ? 'status-active' : 'status-pending'}" style="display: inline-block; margin-top: 0.5rem;">${client.connectionApproved ? 'Підключено' : 'Очікує'}</p>` : '<p class="status-badge status-debt" style="display: inline-block; margin-top: 0.5rem;">Без договору</p>'}
				<button class="logout-btn delete-client-btn" data-id="${client.id}" style="margin-top: 0.5rem; width: 100%;">Видалити клієнта</button>
			`;
			clientsGrid.appendChild(card);
		});

		document.querySelectorAll('.delete-client-btn').forEach(btn => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				const clientId = parseFloat(btn.dataset.id);
				const client = this.authService.getUserById(clientId);

				if (client) {
					const confirmed = await ModalService.confirm(
						'Видалення клієнта',
						`Видалити клієнта ${client.fio}?\n\nВсі дані, включаючи договір та історію, будуть втрачені назавжди!`
					);

					if (confirmed) {
						this.authService.deleteUser(clientId);
						ModalService.show('Успіх', 'Клієнта видалено!', 'success');
						this.loadClientsList();
						this.loadEquipment();
					}
				}
			});
		});
	}

	loadStaffList() {
		const staffList = document.getElementById('staffList');
		const staff = this.authService.users.filter(u => u.role === 'support');

		staffList.innerHTML = '<h4 style="margin-top: 2rem;">Співробітники підтримки:</h4>';

		staff.forEach(s => {
			const item = document.createElement('div');
			item.className = 'service-card';
			item.style.marginTop = '1rem';
			item.innerHTML = `
								<div style="display: flex; justify-content: space-between; align-items: center;">
										<div>
												<strong>${s.name}</strong><br>
												<small>${s.email}</small>
										</div>
										<button class="logout-btn delete-staff-btn" data-email="${s.email}">Видалити</button>
								</div>
						`;
			staffList.appendChild(item);
		});

		document.querySelectorAll('.delete-staff-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.deleteStaff(btn.dataset.email);
			});
		});
	}

	async addStaff() {
		const name = await ModalService.prompt('Новий співробітник', 'Введіть ПІБ співробітника:');
		if (!name) return;

		const email = await ModalService.prompt('Email', 'Введіть email:');
		if (!email || !ValidationService.validateEmail(email)) {
			ModalService.show('Помилка', 'Невірний формат email', 'error');
			return;
		}

		if (this.authService.users.find(u => u.email === email)) {
			ModalService.show('Помилка', 'Користувач з таким email вже існує', 'error');
			return;
		}

		const password = await ModalService.prompt('Пароль', 'Введіть пароль (мінімум 6 символів, хоча б 1 цифра):');
		if (!password || !ValidationService.validatePassword(password)) {
			ModalService.show('Помилка', 'Пароль має містити мінімум 6 символів та хоча б 1 цифру', 'error');
			return;
		}

		const support = new Support(email, password, name);
		this.authService.users.push(support);
		this.authService.saveUsers();
		this.loadStaffList();
		ModalService.show('Успіх', 'Співробітника додано!', 'success');
	}

	async deleteStaff(email) {
		const confirmed = await ModalService.confirm('Підтвердження', 'Видалити цього співробітника?');
		if (confirmed) {
			this.authService.users = this.authService.users.filter(u => u.email !== email);
			this.authService.saveUsers();
			this.loadStaffList();
			ModalService.show('Успіх', 'Співробітника видалено!', 'success');
		}
	}

	loadEquipment() {
		const equipmentGrid = document.getElementById('equipmentGrid');
		const clients = this.authService.users.filter(u => u.role === 'client' && u.contract);

		equipmentGrid.innerHTML = '';

		if (clients.length === 0) {
			equipmentGrid.innerHTML = '<p style="grid-column: 1/-1; color: var(--gray-color);">Немає підключеного обладнання</p>';
			return;
		}

		clients.forEach(client => {
			if (!client.equipmentStatus) {
				client.equipmentStatus = client.connectionApproved ? 'online' : 'pending';
			}

			const status = client.equipmentStatus;
			const item = document.createElement('div');
			item.className = `equipment-item ${status}`;
			item.innerHTML = `
				<strong>${client.contract.equipmentId}</strong><br>
				<small>${client.fio}</small><br>
				<span class="status-badge ${status === 'online' ? 'status-active' : status === 'offline' ? 'status-debt' : 'status-pending'}" style="font-size: 0.8rem; padding: 0.3rem 0.6rem; margin-top: 0.5rem; display: inline-block;">
					${status === 'online' ? 'Онлайн' : status === 'offline' ? 'Офлайн' : 'Очікує'}
				</span>
				<div class="equipment-actions">
					${!client.connectionApproved ?
					'<button class="approve-btn" data-id="' + client.id + '">Підтвердити</button>'
					: ''}
					${client.connectionApproved ? `
						${status !== 'online' ? '<button class="status-control-btn set-online" data-id="' + client.id + '">Увімкнути</button>' : ''}
						${status !== 'offline' ? '<button class="status-control-btn set-offline" data-id="' + client.id + '">Вимкнути</button>' : ''}
					` : ''}
				</div>
			`;
			item.title = `Клієнт: ${client.fio}\nАдреса: ${client.contract.address}\nПослуга: ${client.contract.serviceType}\nСтатус: ${status}`;
			equipmentGrid.appendChild(item);
		});

		document.querySelectorAll('.approve-btn').forEach(btn => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				const clientId = parseFloat(btn.dataset.id);
				const client = this.authService.getUserById(clientId);

				if (client) {
					const confirmed = await ModalService.confirm(
						'Підтвердження підключення',
						`Підтвердити підключення для ${client.fio}?\n\nАдреса: ${client.contract.address}\nПослуга: ${client.contract.serviceType === 'internet' ? 'Інтернет' : 'Інтернет + ТБ'}`
					);

					if (confirmed) {
						client.connectionApproved = true;
						client.contract.status = 'active';
						client.equipmentStatus = 'online';
						this.authService.updateUser(client);
						ModalService.show('Успіх', 'Підключення підтверджено! Клієнт може активувати послугу після оплати.', 'success');
						this.loadEquipment();
					}
				}
			});
		});

		document.querySelectorAll('.status-control-btn').forEach(btn => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				const clientId = parseFloat(btn.dataset.id);
				const client = this.authService.getUserById(clientId);
				const newStatus = btn.classList.contains('set-online') ? 'online' : 'offline';

				if (client) {
					const statusText = newStatus === 'online' ? 'увімкнути' : 'вимкнути';
					const confirmed = await ModalService.confirm(
						'Зміна статусу обладнання',
						`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} обладнання ${client.contract.equipmentId}?\n\nКлієнт: ${client.fio}`
					);

					if (confirmed) {
						client.equipmentStatus = newStatus;
						this.authService.updateUser(client);
						ModalService.show(
							'Успіх',
							`Обладнання ${newStatus === 'online' ? 'увімкнено' : 'вимкнено'}!`,
							'success'
						);
						this.loadEquipment();
					}
				}
			});
		});
	}

	async handleForgotPassword() {
		const email = await ModalService.prompt('Відновлення паролю', 'Введіть ваш email:', 'user@example.com');
		if (!email) return;

		try {
			const code = this.authService.getTempCode(email);
			await ModalService.show('Код надіслано', `Надіслано тимчасовий код на ваш email (імітація). Код: ${code}`, 'info');

			const userCode = await ModalService.prompt('Введення коду', 'Введіть 6-значний код з вашої пошти:');
			if (!userCode) return;

			this.authService.verifyCode(email, userCode);

			let newPassword, confirmPassword;

			do {
				newPassword = await ModalService.prompt('Новий пароль', 'Введіть новий пароль (мін. 6 символів, 1 цифра):', '******');
				if (!newPassword) return;

				confirmPassword = await ModalService.prompt('Підтвердження паролю', 'Підтвердіть новий пароль:');
				if (!confirmPassword) return;

				if (newPassword !== confirmPassword) {
					await ModalService.show('Помилка', 'Паролі не співпадають. Спробуйте ще раз.', 'error');
				}
			} while (newPassword !== confirmPassword);

			if (!ValidationService.validatePassword(newPassword)) {
				await ModalService.show('Помилка', 'Пароль має містити мінімум 6 символів та хоча б 1 цифру', 'error');
				return;
			}

			this.authService.resetPassword(email, newPassword);
			await ModalService.show('Успіх', 'Пароль успішно змінено! Тепер ви можете увійти.', 'success');

		} catch (error) {
			ModalService.show('Помилка', error.message, 'error');
		}
	}

	updateRecurringStatus(client) {
		const toggleContainer = document.getElementById('recurringPaymentToggle');
		const isRecurring = client.isRecurring || false;

		toggleContainer.innerHTML = `
			<label class="switch">
				<input type="checkbox" id="recurringToggle" ${isRecurring ? 'checked' : ''}>
				<span class="slider round"></span>
			</label>
			<span style="margin-left: 1rem; font-weight: bold;">
				${isRecurring ? 'Активний' : 'Неактивний'}
			</span>
		`;

		document.getElementById('recurringToggle').addEventListener('change', async (e) => {
			const newState = billingService.toggleRecurringPayment(client);
			if (newState) {
				ModalService.show('Успіх', 'Регулярний платіж активовано!', 'success');
			} else {
				ModalService.show('Успіх', 'Регулярний платіж деактивовано!', 'success');
			}
			this.updateRecurringStatus(client);
		});
	}
}

class BillingService {
	constructor(authService) {
		this.authService = authService;
		this.startAutoBilling();
	}

	startAutoBilling() {
		setInterval(() => {
			this.processMonthlyPayments();
		}, 86400000);
	}

	toggleRecurringPayment(client) {
		client.isRecurring = !client.isRecurring;
		this.authService.updateUser(client);
		return client.isRecurring;
	}

	makePayment(client, amount, isRecurring = false) {
		client.balance += amount;
		if (isRecurring) {
			client.isRecurring = true;
		}
		if (client.balance >= 0 && client.contract && client.connectionApproved) {
			client.contract.status = 'active';
		}
		this.authService.updateUser(client);
		return true;
	}

	processMonthlyPayments() {
		const clients = this.authService.users.filter(u => u.role === 'client' && u.contract && u.connectionApproved);

		clients.forEach(client => {
			const lastPayment = new Date(client.lastPaymentDate);
			const now = new Date();
			const daysSincePayment = (now - lastPayment) / (1000 * 60 * 60 * 24);
			const isRecurring = client.isRecurring || false;

			if (daysSincePayment >= 30) {
				const amount = client.contract.serviceType === 'internet' ? 300 : 450;

				if (isRecurring && client.balance >= amount) {
					client.balance -= amount;
					client.lastPaymentDate = now;
					console.log(`[BILLING] Регулярний платіж ${amount} грн списано для ${client.email}`);
				} else if (isRecurring && client.balance < amount) {
					client.balance -= amount;
					client.lastPaymentDate = now;
					console.log(`[BILLING] Спроба регулярного платежу для ${client.email} - недостатньо коштів.`);
				} else if (!isRecurring) {
					client.balance -= amount;
					client.lastPaymentDate = now;
				}

				if (client.balance < 0) {
					client.contract.status = 'debt';
				} else {
					client.contract.status = 'active';
				}

				this.authService.updateUser(client);
			}
		});
	}
}

class MessageService {
	constructor(authService) {
		this.authService = authService;
	}

	sendMessage(fromUser, toUser, message) {
		const msg = {
			from: fromUser.email,
			to: toUser ? toUser.email : 'support',
			text: message,
			timestamp: new Date(),
			read: false
		};

		if (fromUser.role === 'client') {
			if (!fromUser.messages) fromUser.messages = [];
			fromUser.messages.push(msg);
		} else {
			if (!toUser.messages) toUser.messages = [];
			toUser.messages.push(msg);
		}

		this.authService.saveUsers();
		return msg;
	}

	getMessages(user) {
		return user.messages || [];
	}
}

// Initialize application
const authService = new AuthService();
const uiController = new UIController(authService);
const billingService = new BillingService(authService);
const messageService = new MessageService(authService);

// Payment button handler
document.getElementById('payBtn').addEventListener('click', async () => {
	const client = authService.currentUser;

	if (!client.connectionApproved) {
		ModalService.show('Увага', 'Очікуйте підтвердження підключення від адміністратора. Оплата буде доступна після активації.', 'warning');
		return;
	}

	const amount = await ModalService.prompt('Оплата', 'Введіть суму для оплати (грн):', '300');

	if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
		const parsedAmount = parseFloat(amount);

		const isRecurring = await ModalService.confirm(
			'Регулярний платіж',
			'Бажаєте зробити цей платіж регулярним (щомісячне автоматичне списання)?'
		);

		billingService.makePayment(client, parsedAmount, isRecurring);

		uiController.updateServiceStatus(client);
		uiController.updateRecurringStatus(client);
		ModalService.show('Успіх',
			`Оплату на суму ${parsedAmount.toFixed(2)} грн успішно проведено!\n\n` +
			(isRecurring ? 'Активовано регулярний платіж.' : '') +
			`Ваш новий баланс: ${client.balance.toFixed(2)} грн`,
			'success');
	} else if (amount !== null) {
		ModalService.show('Помилка', 'Будь ласка, введіть коректну суму', 'error');
	}
});

// Send message handler
document.getElementById('sendMessageBtn').addEventListener('click', () => {
	const input = document.getElementById('messageInput');
	const message = input.value.trim();

	if (message) {
		const user = authService.currentUser;
		messageService.sendMessage(user, null, message);

		const chatMessages = document.getElementById('chatMessages');
		const msgDiv = document.createElement('div');
		msgDiv.className = 'message user';
		msgDiv.innerHTML = `<small>${new Date().toLocaleTimeString('uk-UA')}</small><br>${message}`;
		chatMessages.appendChild(msgDiv);
		chatMessages.scrollTop = chatMessages.scrollHeight;

		input.value = '';

		setTimeout(() => {
			const responseDiv = document.createElement('div');
			responseDiv.className = 'message support';
			responseDiv.innerHTML = `<small>${new Date().toLocaleTimeString('uk-UA')}</small><br>Дякуємо за звернення! Наші спеціалісти опрацюють ваш запит найближчим часом.`;
			chatMessages.appendChild(responseDiv);
			chatMessages.scrollTop = chatMessages.scrollHeight;

			const supportMsg = {
				from: 'support',
				to: user.email,
				text: 'Дякуємо за звернення! Наші спеціалісти опрацюють ваш запит найближчим часом.',
				timestamp: new Date(),
				read: true
			};
			if (!user.messages) user.messages = [];
			user.messages.push(supportMsg);
			authService.updateUser(user);
		}, 1000);
	}
});

document.getElementById('messageInput').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		document.getElementById('sendMessageBtn').click();
	}
});

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     Система авторизації Super Internet запущена!      ║');
console.log('╠═══════════════════════════════════════════════════════╣');
console.log('║ Тестові акаунти:                                      ║');
console.log('║ • Адмін:      admin@super.net / admin123              ║');
console.log('║ • Підтримка:  support@super.net / support123          ║');
console.log('╚═══════════════════════════════════════════════════════╝');