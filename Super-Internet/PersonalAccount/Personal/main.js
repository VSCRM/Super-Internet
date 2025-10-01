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
	}

	createContract(serviceType) {
		this.contract = new Contract(this.id, this.fio, this.phone, this.email, serviceType);
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
	constructor(userId, fio, phone, email, serviceType) {
		this.id = 'CNT' + Date.now();
		this.userId = userId;
		this.fio = fio;
		this.phone = phone;
		this.email = email;
		this.address = 'м. Калуш, вул. Січових Стрільців, 15';
		this.serviceType = serviceType;
		this.equipmentId = 'EQ' + Math.floor(Math.random() * 10000);
		this.status = 'active';
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
		return fio.trim().split(' ').length >= 2;
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
		const data = localStorage.getItem('superInternetUsers');
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
		localStorage.setItem('superInternetUsers', JSON.stringify(this.users));
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
		const index = this.users.findIndex(u => u.email === user.email);
		if (index !== -1) {
			this.users[index] = user;
			this.saveUsers();
		}
	}
}

class UIController {
	constructor(authService) {
		this.authService = authService;
		this.initEventListeners();
	}

	initEventListeners() {
		// Tab switching
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
		});

		// Forms
		document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
		document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

		// Logout
		document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

		// Dashboard tabs
		document.querySelectorAll('.nav-tab').forEach(tab => {
			tab.addEventListener('click', (e) => this.switchDashboardTab(e.target.dataset.content));
		});

		// Service selection
		document.querySelectorAll('.service-option').forEach(option => {
			option.addEventListener('click', (e) => this.selectService(e.currentTarget.dataset.service));
		});
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

		if (!validator(value)) {
			input.classList.add('error');
			input.classList.remove('success');
			errorElement.classList.add('show');
			return false;
		} else {
			input.classList.remove('error');
			input.classList.add('success');
			errorElement.classList.remove('show');
			return true;
		}
	}

	handleRegister(e) {
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
		const isPasswordMatch = password.value === passwordConfirm.value;

		if (!isPasswordMatch) {
			passwordConfirm.classList.add('error');
			passwordConfirm.nextElementSibling.classList.add('show');
		} else {
			passwordConfirm.classList.remove('error');
			passwordConfirm.nextElementSibling.classList.remove('show');
		}

		if (isEmailValid && isPhoneValid && isFIOValid && isPasswordValid && isPasswordMatch) {
			try {
				const client = this.authService.register(
					email.value,
					password.value,
					phone.value,
					fio.value
				);
				this.authService.currentUser = client;
				this.showDashboard();
			} catch (error) {
				alert(error.message);
			}
		}
	}

	handleLogin(e) {
		e.preventDefault();

		const email = document.getElementById('loginEmail').value;
		const password = document.getElementById('loginPassword').value;

		try {
			const user = this.authService.login(email, password);
			this.showDashboard();
		} catch (error) {
			alert(error.message);
		}
	}

	handleLogout() {
		this.authService.logout();
		document.getElementById('authContainer').classList.remove('hidden');
		document.getElementById('dashboard').classList.add('hidden');

		// Hide all dashboards
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
		}
		this.updateContract(client);
	}

	selectService(serviceType) {
		const client = this.authService.currentUser;
		client.createContract(serviceType);
		this.authService.saveUsers();
		this.showClientDashboard(client);
		alert('Послугу успішно підключено! Договір сформовано.');
	}

	updateServiceStatus(client) {
		const serviceNames = {
			'internet': 'Інтернет',
			'internet_tv': 'Інтернет + Телебачення'
		};

		document.getElementById('currentService').textContent = serviceNames[client.contract.serviceType];
		document.getElementById('balance').textContent = client.balance.toFixed(2) + ' грн';

		const statusBadge = document.getElementById('serviceStatusBadge');
		if (client.balance >= 0) {
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
			document.getElementById('contractStatus').innerHTML = client.contract.status === 'active'
				? '<span class="status-badge status-active">Активний</span>'
				: '<span class="status-badge status-debt">Борг</span>';
		}
	}

	switchDashboardTab(content) {
		document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

		event.target.classList.add('active');
		document.getElementById(content + 'Content').classList.add('active');
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
			card.addEventListener('click', () => this.openTicket(user));
			ticketsGrid.appendChild(card);
		});
	}

	openTicket(user) {
		const messages = user.messages.map(m => `[${new Date(m.timestamp).toLocaleString('uk-UA')}] ${m.text}`).join('\n');
		const contractInfo = user.contract
			? `Договір: ${user.contract.id}\nПослуга: ${user.contract.serviceType}\nСтатус: ${user.contract.status}\nБаланс: ${user.balance} грн`
			: 'Договір відсутній';

		alert(`Звернення від ${user.fio}\n\n${contractInfo}\n\nПовідомлення:\n${messages}`);
	}

	showAdminDashboard() {
		document.getElementById('clientDashboard').classList.add('hidden');
		document.getElementById('supportDashboard').classList.add('hidden');
		document.getElementById('adminDashboard').classList.remove('hidden');

		this.loadStaffList();
		this.loadEquipment();

		// Remove old listener if exists
		const oldBtn = document.getElementById('addStaffBtn');
		const newBtn = oldBtn.cloneNode(true);
		oldBtn.parentNode.replaceChild(newBtn, oldBtn);

		newBtn.addEventListener('click', () => this.addStaff());
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

		// Add event listeners to delete buttons
		document.querySelectorAll('.delete-staff-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.deleteStaff(btn.dataset.email);
			});
		});
	}

	addStaff() {
		const name = prompt('Введіть ПІБ співробітника:');
		if (!name) return;

		const email = prompt('Введіть email:');
		if (!email || !ValidationService.validateEmail(email)) {
			alert('Невірний формат email');
			return;
		}

		if (this.authService.users.find(u => u.email === email)) {
			alert('Користувач з таким email вже існує');
			return;
		}

		const password = prompt('Введіть пароль:');
		if (!password || !ValidationService.validatePassword(password)) {
			alert('Пароль має містити мінімум 6 символів та хоча б 1 цифру');
			return;
		}

		const support = new Support(email, password, name);
		this.authService.users.push(support);
		this.authService.saveUsers();
		this.loadStaffList();
		alert('Співробітника додано!');
	}

	deleteStaff(email) {
		if (confirm('Видалити цього співробітника?')) {
			this.authService.users = this.authService.users.filter(u => u.email !== email);
			this.authService.saveUsers();
			this.loadStaffList();
			alert('Співробітника видалено!');
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
			const status = Math.random() > 0.2 ? 'online' : 'offline';
			const item = document.createElement('div');
			item.className = `equipment-item ${status}`;
			item.innerHTML = `
                <strong>${client.contract.equipmentId}</strong><br>
                <small>${client.fio}</small><br>
                <span class="status-badge ${status === 'online' ? 'status-active' : 'status-debt'}" style="font-size: 0.8rem; padding: 0.3rem 0.6rem; margin-top: 0.5rem; display: inline-block;">
                    ${status === 'online' ? 'Онлайн' : 'Офлайн'}
                </span>
            `;
			item.title = `Клієнт: ${client.fio}\nАдреса: ${client.contract.address}\nПослуга: ${client.contract.serviceType}\nСтатус: ${status}`;
			equipmentGrid.appendChild(item);
		});
	}
}

class BillingService {
	constructor(authService) {
		this.authService = authService;
		this.startAutoBilling();
	}

	startAutoBilling() {
		// Перевірка раз на добу (86400000 мс)
		setInterval(() => {
			this.processMonthlyPayments();
		}, 86400000);
	}

	processMonthlyPayments() {
		const clients = this.authService.users.filter(u => u.role === 'client' && u.contract);

		clients.forEach(client => {
			const lastPayment = new Date(client.lastPaymentDate);
			const now = new Date();
			const daysSincePayment = (now - lastPayment) / (1000 * 60 * 60 * 24);

			if (daysSincePayment >= 30) {
				const amount = client.contract.serviceType === 'internet' ? 300 : 450;
				client.balance -= amount;
				client.lastPaymentDate = now;

				if (client.balance < 0) {
					client.contract.status = 'debt';
				} else {
					client.contract.status = 'active';
				}

				this.authService.updateUser(client);
			}
		});
	}

	makePayment(client, amount) {
		client.balance += amount;
		if (client.balance >= 0 && client.contract) {
			client.contract.status = 'active';
		}
		this.authService.updateUser(client);
		return true;
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
document.getElementById('payBtn').addEventListener('click', () => {
	const amount = prompt('Введіть суму для оплати (грн):');
	if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
		billingService.makePayment(authService.currentUser, parseFloat(amount));
		uiController.updateServiceStatus(authService.currentUser);
		alert(`Оплату на суму ${amount} грн успішно проведено!\nВаш новий баланс: ${authService.currentUser.balance.toFixed(2)} грн`);
	} else if (amount !== null) {
		alert('Будь ласка, введіть коректну суму');
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

		// Simulate support response
		setTimeout(() => {
			const responseDiv = document.createElement('div');
			responseDiv.className = 'message support';
			responseDiv.innerHTML = `<small>${new Date().toLocaleTimeString('uk-UA')}</small><br>Дякуємо за звернення! Наші спеціалісти опрацюють ваш запит найближчим часом.`;
			chatMessages.appendChild(responseDiv);
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}, 1000);
	}
});

// Enter key to send message
document.getElementById('messageInput').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		document.getElementById('sendMessageBtn').click();
	}
});

// Console info
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     Система авторизації Super Internet запущена!       ║');
console.log('╠════════════════════════════════════════════════════════╣');
console.log('║ Тестові акаунти:                                       ║');
console.log('║ • Адмін:      admin@super.net / admin123               ║');
console.log('║ • Підтримка:  support@super.net / support123           ║');
console.log('╚════════════════════════════════════════════════════════╝');