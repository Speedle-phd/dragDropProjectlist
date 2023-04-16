"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const app = document.querySelector('#app');
const Autobind = (_, _2, desc) => {
    const oldFn = desc.value;
    const adjustedDescriptor = {
        enumerable: false,
        configurable: true,
        get() {
            const boundFn = oldFn.bind(this);
            return boundFn;
        },
    };
    return adjustedDescriptor;
};
class State {
    constructor() {
        this.listener = [];
    }
    addListener(listenerFn) {
        this.listener.push(listenerFn);
    }
}
class ProjectState extends State {
    constructor() {
        super();
        this.projects = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    addProject(project) {
        this.projects.push(project);
        this.updateLS();
    }
    executeListeners() {
        for (const listenerFn of this.listener) {
            listenerFn(this.projects.slice());
        }
    }
    updateLS() {
        localStorage.setItem('TS-dragDrop-projectList', JSON.stringify(this.projects));
        this.executeListeners();
    }
    getLS() {
        const fetchedLS = localStorage.getItem('TS-dragDrop-projectList');
        if (!fetchedLS)
            return;
        this.projects = JSON.parse(fetchedLS);
        this.executeListeners();
    }
    get getProjects() {
        return this.projects;
    }
    set setProjects(v) {
        this.projects = v;
    }
    addDeleteHandler() {
        if (document.querySelector('.projects .fa-trash')) {
            ;
            [
                ...document.querySelectorAll('.projects .fa-trash'),
            ].forEach((el) => {
                el.addEventListener('click', this.deleteData);
            });
        }
    }
    deleteData(e) {
        var _a;
        const { target: t } = e;
        if (!(t === null || t === void 0 ? void 0 : t.closest('.fa-trash')))
            return;
        const liID = (_a = e.target.parentElement) === null || _a === void 0 ? void 0 : _a.dataset.id;
        stateManager.setProjects = stateManager.getProjects.filter((el) => el.id !== liID);
        stateManager.updateLS();
    }
}
__decorate([
    Autobind
], ProjectState.prototype, "deleteData", null);
const stateManager = ProjectState.getInstance();
const validate = (validatableInput) => {
    let isValid = true;
    if (validatableInput.required) {
        isValid && (isValid = validatableInput.value.toString().trim().length > 0);
    }
    if (validatableInput.minlength && validatableInput.minlength != null) {
        if (typeof validatableInput.value === 'string') {
            isValid && (isValid = validatableInput.value.trim().length >= validatableInput.minlength);
        }
    }
    if (validatableInput.maxlength) {
        if (typeof validatableInput.value === 'string') {
            isValid && (isValid = validatableInput.value.trim().length <= validatableInput.maxlength);
        }
    }
    if (validatableInput.max) {
        if (typeof validatableInput.value === 'number') {
            isValid && (isValid = validatableInput.value <= validatableInput.max);
        }
    }
    if (validatableInput.min) {
        if (typeof validatableInput.value === 'number') {
            isValid && (isValid = validatableInput.value >= validatableInput.min);
        }
    }
    return isValid;
};
class ComponentBaseClass {
    constructor(selectorTemplate, selectorHost, append, type) {
        this.append = append;
        this.type = type;
        this.hostElement = document.querySelector(`#${selectorHost}`);
        this.templateElement = document.querySelector(`#${selectorTemplate}`);
        this.baseElement = this.templateElement.content.cloneNode(true)
            .firstElementChild;
    }
    renderProjectList() {
        if (this.type) {
            this.baseElement.id = this.type;
            if (this.type === 'pending-projects') {
                this.baseElement.querySelector(`#${this.type}>header>h2`).textContent =
                    'Pending Projects';
            }
            else {
                this.baseElement.querySelector(`#${this.type}>header>h2`).textContent =
                    'Finished Projects';
            }
        }
        else {
            this.baseElement.id = 'user-input';
        }
        this.append ? this.hostElement.appendChild(this.baseElement) : this.hostElement.prepend(this.baseElement);
    }
}
class ProjectInput extends ComponentBaseClass {
    constructor() {
        super("project-input", 'app', false);
        this.renderProjectList();
        this.configure();
    }
    renderData() { }
    configure() {
        this.baseElement.addEventListener('submit', this.handleSubmit);
    }
    gatherUserInput() {
        const formData = new FormData(this.baseElement);
        const title = formData.get('title');
        const description = formData.get('description');
        const people = +formData.get('people');
        if (!validate({
            value: title,
            required: true,
            minlength: 3,
            maxlength: 10,
        }) ||
            !validate({
                value: description,
                required: true,
                minlength: 5,
                maxlength: 50,
            }) ||
            !validate({ value: people, required: true, min: 1, max: 10 })) {
            throw new Error('invalid input');
        }
        const inputArr = [title.trim(), description.trim(), people];
        this.baseElement.reset();
        const deepenedArr = [...formData.keys()].map((el, index) => {
            return [el, inputArr[index]];
        });
        return Object.fromEntries(deepenedArr);
    }
    handleSubmit(e) {
        e.preventDefault();
        const userInputObj = this.gatherUserInput();
        if (!userInputObj)
            return;
        stateManager.addProject(new Projects(userInputObj));
        projectList.renderData();
    }
}
__decorate([
    Autobind
], ProjectInput.prototype, "handleSubmit", null);
class Projects {
    constructor(obj) {
        this.title = obj.title;
        this.description = obj.description;
        this.people = obj.people;
        this.createdAt = new Date();
        this.id = crypto.randomUUID();
        this.completed = "pending-projects";
    }
}
class ProjectList extends ComponentBaseClass {
    constructor(type) {
        super("project-list", "app", true, type);
        this.assignedProjects = [];
        stateManager.addListener((projects) => {
            const relevantProjects = projects.filter(el => el.completed === this.type);
            this.assignedProjects = relevantProjects;
            this.renderData();
        });
        this.renderProjectList();
        stateManager.getLS();
    }
    configure() {
        if (document.querySelector('#pending-projects li')) {
            ;
            [...document.querySelectorAll('#pending-projects li')].forEach(el => {
                el.addEventListener('dragstart', this.dragStartHandler);
                el.addEventListener('dragend', this.dragEndHandler);
            });
        }
        if (document.querySelector('#finished-projects ul')) {
            const ul = document.querySelector('#finished-projects ul');
            ul.addEventListener('dragover', this.dragOverHandler);
            ul.addEventListener('dragleave', this.dragLeaveHandler);
            ul.addEventListener('drop', this.dropHandler);
        }
    }
    renderData() {
        var _a;
        const ul = document.querySelector(`#${this.type} ul`);
        this.assignedProjects.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        ul.innerHTML = ((_a = this.assignedProjects) !== null && _a !== void 0 ? _a : [])
            .map((el) => {
            const { title, description, people, id } = el;
            return `<li draggable="true" class="single-project" data-id="${id}">
         <header>
            <h4>${title}</h4>
            <div class="underline"></div>
         </header>
         <p>${description}</p>
         <p>People participating: <span>${people}</span></p>
         <i class="fas fa-trash"></i>
         </li>
         `;
        })
            .join('');
        stateManager.addDeleteHandler();
        this.configure();
    }
    dragEndHandler(e) {
        const ul = document.querySelector('#finished-projects ul');
        ul.classList.remove('droppable');
    }
    dragStartHandler(e) {
        var _a;
        const t = e.target.closest('li');
        const id = (_a = t.dataset.id) === null || _a === void 0 ? void 0 : _a.toString();
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = "move";
        console.log(id);
    }
    dropHandler(e) {
        var _a;
        const id = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
        stateManager.getProjects.find(el => el.id === id).completed = "finished-projects";
        stateManager.updateLS();
    }
    dragLeaveHandler(e) {
        const ul = document.querySelector('#finished-projects ul');
        ul.classList.remove('droppable');
    }
    dragOverHandler(e) {
        var _a;
        if (((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.types[0]) === 'text/plain') {
            e.preventDefault();
            const ul = document.querySelector('#finished-projects ul');
            ul.classList.add('droppable');
        }
    }
}
__decorate([
    Autobind
], ProjectList.prototype, "dragEndHandler", null);
__decorate([
    Autobind
], ProjectList.prototype, "dragStartHandler", null);
__decorate([
    Autobind
], ProjectList.prototype, "dropHandler", null);
__decorate([
    Autobind
], ProjectList.prototype, "dragLeaveHandler", null);
__decorate([
    Autobind
], ProjectList.prototype, "dragOverHandler", null);
const projectList = new ProjectList('pending-projects');
const finishedList = new ProjectList('finished-projects');
const projectInput = new ProjectInput();
//# sourceMappingURL=app.js.map