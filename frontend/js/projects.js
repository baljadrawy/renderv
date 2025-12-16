class ProjectsManager {
    constructor() {
        this.projectsList = document.getElementById('projects-list');
        this.saveBtn = document.getElementById('save-project-btn');
        this.htmlEditor = document.getElementById('html-editor');
        this.cssEditor = document.getElementById('css-editor');
        this.jsEditor = document.getElementById('js-editor');
        this.resolutionSelect = document.getElementById('resolution');
        this.formatSelect = document.getElementById('format');
        this.durationInput = document.getElementById('duration');
        this.fpsSelect = document.getElementById('fps');
        
        this.currentProjectId = null;
        
        this.init();
    }

    init() {
        this.saveBtn.addEventListener('click', () => this.saveProject());
        this.loadProjects();
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects/list');
            const data = await response.json();
            
            if (data.success && data.projects.length > 0) {
                this.renderProjects(data.projects);
            } else {
                this.projectsList.innerHTML = '<p class="no-projects">لا توجد مشاريع محفوظة</p>';
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    renderProjects(projects) {
        this.projectsList.innerHTML = projects.map(project => `
            <div class="project-item" data-id="${project.id}">
                <div class="project-info">
                    <span class="project-name">${this.escapeHtml(project.name)}</span>
                    <span class="project-date">${this.formatDate(project.updated_at)}</span>
                </div>
                <div class="project-actions">
                    <button class="load-btn" onclick="projectsManager.loadProject(${project.id})" title="تحميل">📂</button>
                    <button class="delete-btn" onclick="projectsManager.deleteProject(${project.id})" title="حذف">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    async saveProject() {
        const name = prompt('اسم المشروع:', 'مشروع جديد');
        if (!name) return;

        const projectData = {
            name,
            html_code: this.htmlEditor.value,
            css_code: this.cssEditor.value,
            js_code: this.jsEditor.value,
            resolution: this.resolutionSelect.value,
            format: this.formatSelect.value,
            duration: parseInt(this.durationInput.value),
            fps: parseInt(this.fpsSelect.value)
        };

        try {
            const response = await fetch('/api/projects/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('تم حفظ المشروع بنجاح', 'success');
                this.loadProjects();
            } else {
                this.showNotification(data.error || 'فشل في حفظ المشروع', 'error');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            this.showNotification('فشل في حفظ المشروع', 'error');
        }
    }

    async loadProject(id) {
        try {
            const response = await fetch(`/api/projects/${id}`);
            const data = await response.json();
            
            if (data.success) {
                const project = data.project;
                this.htmlEditor.value = project.html_code || '';
                this.cssEditor.value = project.css_code || '';
                this.jsEditor.value = project.js_code || '';
                this.resolutionSelect.value = project.resolution || 'HD_Vertical';
                this.formatSelect.value = project.format || 'MP4';
                this.durationInput.value = project.duration || 15;
                this.fpsSelect.value = project.fps || 30;
                
                this.currentProjectId = id;
                
                if (window.previewManager) {
                    window.previewManager.updatePreview();
                    window.previewManager.updateResolutionDisplay();
                }
                
                this.showNotification('تم تحميل المشروع', 'success');
            } else {
                this.showNotification(data.error || 'فشل في تحميل المشروع', 'error');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            this.showNotification('فشل في تحميل المشروع', 'error');
        }
    }

    async deleteProject(id) {
        if (!confirm('هل تريد حذف هذا المشروع؟')) return;

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('تم حذف المشروع', 'success');
                this.loadProjects();
            } else {
                this.showNotification(data.error || 'فشل في حذف المشروع', 'error');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showNotification('فشل في حذف المشروع', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.projectsManager = new ProjectsManager();
});
