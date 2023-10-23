// Получаем элементы из DOM
const todoList = document.getElementById('todo-list');
const form = document.querySelector('form');

// Инициализируем массивы для задач и пользователей
let ToDoList = [];
let Users = [];

// Идентификатор последней задачи
let lastId = 201;

// Добавляем обработчики событий при загрузке страницы и отправке формы
document.addEventListener('DOMContentLoaded', initApp);
form.addEventListener('submit', handleSubmit);

// Функция для получения имени пользователя по его идентификатору
function getUserName(userId) {
    const user = Users.find(u => u.id === userId);
    return user ? user.name : 'Неизвестный пользователь';
}

// Инициализация приложения
async function initApp() {
    try {
        // Загружаем все задачи и пользователей
        const [todos, users] = await Promise.all([getAllTodos(), getAllUsers()]);
        // Заполняем массивы задач и пользователей
        ToDoList = todos;
        Users = users;
        // Заполняем выпадающий список пользователей и список задач
        fillUsers();
        fillToDoList();
    } catch (error) {
        alertError(error);
    }
}


// Асинхронно получаем все задачи с сервера
async function getAllTodos() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        if (!response.ok) {
            throw new Error('Не удалось получить задачи с сервера');
        }
        return await response.json();
    } catch (error) {
        alertError(error);
        throw error; // Перехват исключения для дальнейшей обработки
    }
}

// Асинхронно получаем всех пользователей с сервера
async function getAllUsers() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) {
            throw new Error('Не удалось получить пользователей с сервера');
        }
        return await response.json();
    } catch (error) {
        alertError(error);
        throw error; // Перехват исключения для дальнейшей обработки
    }
}


// Удаляем задачу по её идентификатору
    function removeTodo(todoId) {
        const index = ToDoList.findIndex(elem => elem.id == todoId);
        if (index !== -1) {
            ToDoList.splice(index, 1);
            const todo = todoList.querySelector(`[data-id="${todoId}"]`);
            if (todo) {
                todo.remove();
            }
            fillToDoList();
        }
    }

// Заполняем список задач на странице
    function fillToDoList() {
        const htmlToDoList = document.getElementById('todo-list');
        htmlToDoList.innerHTML = '';
        ToDoList.forEach(element => {
            // Создаем элементы для каждой задачи и добавляем их в список задач
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.dataset.id = element.id;

            const status = document.createElement('input');
            status.type = 'checkbox';
            status.checked = element.completed;
            status.addEventListener('change', eventStatus);
            status.style.transform = 'scale(1.5)';

            const close = document.createElement('span');
            close.innerHTML = '&times;';
            close.className = 'close';
            close.addEventListener('click', eventDelete);
            close.style.fontSize = '2em';

            const liText = document.createElement('span');
            liText.className = 'liText';
            liText.innerHTML = `${element.title} <i>by <b>${getUserName(element.userId)}</b></i>`;

            if (element.completed) {
                liText.classList.add('strikethroughText');
                liText.innerHTML = `<del> ${liText.innerHTML} </del>`;
            }

            li.appendChild(status);
            li.appendChild(liText);
            li.appendChild(close);
            htmlToDoList.appendChild(li);
        });
    }

// Обработчик изменения статуса задачи
    async function eventStatus() {
        const id = this.parentElement.dataset.id;
        const index = ToDoList.findIndex(e => e.id == id);
        if (index !== -1) {
            if (navigator.onLine) {
                ToDoList[index].completed = !ToDoList[index].completed;
                await updateTodoStatus(id, ToDoList[index].completed);
                fillToDoList();
            } else {
                alert('Отсутствует интернет-соединение. Невозможно изменить статус задачи.');
                this.checked = !this.checked; // Отменяем изменение чекбокса
            }
        }
    }

// Обработчик удаления задачи
    async function eventDelete() {
        const todoId = this.parentElement.dataset.id;
        if (navigator.onLine) {
            await deleteTodo(todoId);
        } else {
            alert('Отсутствует интернет-соединение. Невозможно удалить задачу.');
        }
    }

// Асинхронно обновляем статус задачи на сервере
    async function updateTodoStatus(todoId, completed) {
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {
                method: 'PATCH',
                body: JSON.stringify({ completed }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Не удалось обновить статус задачи на сервере');
            }
        } catch (error) {
            alertError(error);
            throw error; // Перехват исключения для дальнейшей обработки
        }
    }

// Асинхронно удаляем задачу на сервере и вызываем функцию удаления в приложении
    async function deleteTodo(todoId) {
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                removeTodo(todoId);
            } else {
                throw new Error('Не удалось удалить задачу на сервере');
            }
        } catch (error) {
            alertError(error);
        }
    }

// Асинхронно создаем новую задачу
    async function createToDo(todo) {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
                method: 'POST',
                body: JSON.stringify(todo),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Не удалось создать новую задачу на сервере');
            }

            const newTodo = await response.json();
            ToDoList.unshift(newTodo);
            fillToDoList();
        } catch (error) {
            alertError(error);
        }
    }

// Обработчик отправки формы для создания новой задачи
    function handleSubmit(event) {
        event.preventDefault();

        // Получаем выбранного пользователя и текст задачи
        const selectedUserName = form.user.value;
        const selectedUser = Users.find(user => user.name === selectedUserName);
        const todoText = form.todo.value.trim(); // Убираем начальные и конечные пробелы

        if (!todoText) {
            alert('Пожалуйста, введите текст задачи.'); // Вывод сообщения об ошибке
        } else if (selectedUser) {
            // Создаем новую задачу и обновляем список задач
            createToDo({
                userId: selectedUser.id,
                id: lastId++,
                title: todoText,
                completed: false,
            });
            form.todo.value = '';
        } else {
            alert('Выбранный пользователь не найден. Пожалуйста, выберите действительного пользователя.');
        }
    }

// Заполняем выпадающий список пользователей
    function fillUsers() {
        const htmlUserSelect = document.getElementById('user-todo');
        Users.forEach(element => {
            const option = document.createElement('option');
            option.innerText = element.name;
            htmlUserSelect.appendChild(option);
        });
    }

let errorDisplayed = false;

// Функция для обработки ошибок и вывода сообщений
function alertError(error) {
    if (!errorDisplayed) {
        console.error('Произошла ошибка:', error);
        alert('Произошла ошибка. Пожалуйста проверьте подключение к интернету или попробуйте позже.');
        errorDisplayed = true;
    }
}

