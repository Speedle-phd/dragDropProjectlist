const app = <HTMLDivElement>document.querySelector('#app')

//autobind decorator
const Autobind = (_: any, _2: string, desc: PropertyDescriptor) => {
   const oldFn = desc.value
   const adjustedDescriptor: PropertyDescriptor = {
      enumerable: false,
      configurable: true,
      get() {
         const boundFn = oldFn.bind(this)
         return boundFn
      },
   }
   return adjustedDescriptor
}

// Drag and Drop Interfaces

interface Draggable {
   dragStartHandler(event: DragEvent) : void;
   dragEndHandler(event: DragEvent) : void;
}

interface Droppable {
   dragOverHandler(event: DragEvent) : void;
   dropHandler(event: DragEvent) : void;
   dragLeaveHandler(event: DragEvent) : void;
}

//Project State Management

type Listener<T> = (items: T[]) => void

class State<T> {
   protected listener: Listener<T>[] = []

   addListener(listenerFn: Listener<T>) {
      this.listener.push(listenerFn)
   }
}

class ProjectState extends State<Projects>{
   private projects: Projects[] = []
   private static instance: ProjectState
   private constructor() {
      super()
   }

   static getInstance() {
      if (this.instance) {
         return this.instance
      }
      this.instance = new ProjectState()
      return this.instance
   }



   addProject(project: Projects) {
      this.projects.push(project)
      this.updateLS()
   }
   executeListeners(){
      for(const listenerFn of this.listener){
         listenerFn(this.projects.slice())
         //passing copy of array
      }
   }
   updateLS() {
      localStorage.setItem(
         'TS-dragDrop-projectList',
         JSON.stringify(this.projects)
      )
      this.executeListeners()
   }
   getLS() {
      const fetchedLS = localStorage.getItem('TS-dragDrop-projectList')
      if (!fetchedLS) return
      this.projects = JSON.parse(fetchedLS)
      this.executeListeners()
   }
   get getProjects() {
      return this.projects
   }
   set setProjects(v: Projects[]) {
      this.projects = v
   }
   addDeleteHandler() {
      if (document.querySelector('.projects .fa-trash')) {
         ;(
            [
               ...document.querySelectorAll('.projects .fa-trash'),
            ] as HTMLElement[]
         ).forEach((el) => {
            el.addEventListener('click', this.deleteData)
         })
      }
   }
   @Autobind
   deleteData(e: MouseEvent) {
      const { target: t } = e
      if (!(t as HTMLElement)?.closest('.fa-trash')) return
      const liID = (e.target as HTMLElement).parentElement?.dataset.id
      stateManager.setProjects = stateManager.getProjects.filter(
         (el) => el.id !== liID
      )

      stateManager.updateLS()

   }
}
const stateManager = ProjectState.getInstance()

interface Validatable {
   value: string | number
   required?: boolean
   maxlength?: number
   minlength?: number
   max?: number
   min?: number
}
const validate = (validatableInput: Validatable): boolean => {
   let isValid = true
   if (validatableInput.required) {
      isValid &&= validatableInput.value.toString().trim().length > 0
   }
   // != null check !!! Because when developer sets minlength to 0 --> falsy value and the code wont run!!!
   if (validatableInput.minlength && validatableInput.minlength != null) {
      if (typeof validatableInput.value === 'string') {
         isValid &&=
            validatableInput.value.trim().length >= validatableInput.minlength
      }
   }
   if (validatableInput.maxlength) {
      if (typeof validatableInput.value === 'string') {
         isValid &&=
            validatableInput.value.trim().length <= validatableInput.maxlength
      }
   }
   if (validatableInput.max) {
      if (typeof validatableInput.value === 'number') {
         isValid &&= validatableInput.value <= validatableInput.max
      }
   }
   if (validatableInput.min) {
      if (typeof validatableInput.value === 'number') {
         isValid &&= validatableInput.value >= validatableInput.min
      }
   }
   return isValid
}

//Component Base Class

abstract class ComponentBaseClass<T extends HTMLElement, U extends HTMLElement> {
   templateElement: HTMLTemplateElement
   hostElement: T
   baseElement: U
   constructor(selectorTemplate: string, selectorHost: string, private append: boolean, public type?: 'pending-projects' | 'finished-projects') {
      this.hostElement = document.querySelector(`#${selectorHost}`)!
      this.templateElement = document.querySelector(`#${selectorTemplate}`)!
      this.baseElement = (this.templateElement.content.cloneNode(true) as T)
         .firstElementChild as U
   }
   renderProjectList() {
      if(this.type){
         this.baseElement.id = this.type
         if (this.type === 'pending-projects') {
            this.baseElement.querySelector(`#${this.type}>header>h2`)!.textContent =
               'Pending Projects'
         } else {
            this.baseElement.querySelector(`#${this.type}>header>h2`)!.textContent =
               'Finished Projects'
         } 
      } else {
            this.baseElement.id = 'user-input'
         }
      this.append ? this.hostElement.appendChild(this.baseElement) : this.hostElement.prepend(this.baseElement)
      
   }
   abstract configure():void
   abstract renderData?():void
}

const enum Status {
   PENDING = 'pending-projects', 
   FINISHED = 'finished-projects'}

class ProjectInput extends ComponentBaseClass<HTMLDivElement, HTMLFormElement>{
   constructor() {
      super("project-input", 'app', false)
      this.renderProjectList()
      this.configure()
   }
   renderData(){}

   configure() {
      this.baseElement.addEventListener('submit', this.handleSubmit)
   }

   // @Autobind
   private gatherUserInput(): void | FormDataType {
      const formData = new FormData(this.baseElement)
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const people = +formData.get('people')! as number
      if (
         !validate({
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
         !validate({ value: people, required: true, min: 1, max: 10 })
      ) {
         throw new Error('invalid input')
      }
      const inputArr = [title.trim(), description.trim(), people]
      this.baseElement.reset()
      const deepenedArr = [...formData.keys()].map((el, index) => {
         return [el, inputArr[index]]
      })
      return Object.fromEntries(deepenedArr)
   }
   @Autobind
   private handleSubmit(e: SubmitEvent) {
      e.preventDefault()
      const userInputObj = this.gatherUserInput()
      if (!userInputObj) return

      stateManager.addProject(new Projects(userInputObj))
      projectList.renderData()
   }
}

interface FormDataType {
   title: string
   description: string
   people: number
}

interface Projects extends FormDataType {
   createdAt: Date
   id: string
   completed: Status
}
class Projects implements Projects {
   constructor(obj: FormDataType) {
      this.title = obj.title
      this.description = obj.description
      this.people = obj.people
      this.createdAt = new Date()
      this.id = crypto.randomUUID()
      this.completed = Status.PENDING
   }
}

class ProjectList extends ComponentBaseClass<HTMLDivElement, HTMLElement> implements Draggable, Droppable{
   assignedProjects: Projects[]

   constructor(type: 'pending-projects' | 'finished-projects') {
      super("project-list", "app", true, type)
      this.assignedProjects = []
      
      stateManager.addListener((projects: Projects[]) => {
         const relevantProjects = projects.filter(el => el.completed === this.type)
         this.assignedProjects = relevantProjects
         this.renderData()
         
      })
      this.renderProjectList()
      stateManager.getLS()
   }
   configure(){
      if(document.querySelector('#pending-projects li')){
         ;([...document.querySelectorAll('#pending-projects li')] as HTMLLIElement[]).forEach(el => {
            el.addEventListener('dragstart', this.dragStartHandler)
            el.addEventListener('dragend', this.dragEndHandler)
         })
      }
      if(document.querySelector('#finished-projects ul')){
         const ul = 
            document.querySelector('#finished-projects ul')! as HTMLUListElement
         ul.addEventListener('dragover', this.dragOverHandler)
         ul.addEventListener('dragleave', this.dragLeaveHandler)
         ul.addEventListener('drop', this.dropHandler)
      }
   }
   renderData() {
      const ul = document.querySelector(
         `#${this.type} ul`
      ) as HTMLUListElement
      this.assignedProjects.sort(
         (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
      )
      ul.innerHTML = (this.assignedProjects ?? [])
         .map((el) => {
            const { title, description, people, id } = el
            return `<li draggable="true" class="single-project" data-id="${id}">
         <header>
            <h4>${title}</h4>
            <div class="underline"></div>
         </header>
         <p>${description}</p>
         <p>People participating: <span>${people}</span></p>
         <i class="fas fa-trash"></i>
         </li>
         `
         })
         .join('')
      stateManager.addDeleteHandler()
      this.configure()
   }
   @Autobind
   dragEndHandler(e: DragEvent): void {
      const ul = document.querySelector(
         '#finished-projects ul'
      )! as HTMLUListElement
      ul.classList.remove('droppable')
   }
   @Autobind
   dragStartHandler(e: DragEvent): void {
      const t = (e.target as HTMLElement).closest('li')! as HTMLLIElement
      const id = t.dataset.id?.toString()!
      e.dataTransfer!.setData('text/plain', id)
      e.dataTransfer!.effectAllowed = "move"
      console.log(id)
   }
   @Autobind
   dropHandler(e: DragEvent): void {
      const id = e.dataTransfer?.getData('text/plain')
      stateManager.getProjects.find(el => el.id === id)!.completed = Status.FINISHED
      stateManager.updateLS()

   }
   @Autobind
   dragLeaveHandler(e: DragEvent): void {
      const ul = document.querySelector('#finished-projects ul')! as HTMLUListElement
      ul.classList.remove('droppable')
   }
   @Autobind
   dragOverHandler(e: DragEvent): void {
      if(e.dataTransfer?.types[0] === 'text/plain'){
         e.preventDefault()
         //default is to not allow dropping
         const ul = document.querySelector('#finished-projects ul')! as HTMLUListElement
         ul.classList.add('droppable')
      }
   }
}



const projectList = new ProjectList('pending-projects')
const finishedList = new ProjectList('finished-projects')
const projectInput = new ProjectInput()
