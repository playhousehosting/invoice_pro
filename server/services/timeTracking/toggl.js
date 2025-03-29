const axios = require('axios');

class TogglService {
  constructor() {
    this.baseURL = 'https://api.track.toggl.com/api/v9';
  }

  initialize(config) {
    this.apiToken = config.apiToken;
    this.workspaceId = config.workspaceId;
    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: this.apiToken,
        password: 'api_token'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Toggl API request error:', error);
      throw error;
    }
  }

  async getWorkspaces() {
    try {
      return await this.makeRequest('get', '/workspaces');
    } catch (error) {
      console.error('Toggl get workspaces error:', error);
      throw error;
    }
  }

  async createClient(clientData) {
    try {
      const data = {
        name: clientData.name,
        workspace_id: this.workspaceId
      };

      return await this.makeRequest('post', '/clients', data);
    } catch (error) {
      console.error('Toggl create client error:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const data = {
        name: projectData.name,
        workspace_id: this.workspaceId,
        client_id: projectData.clientId,
        is_private: projectData.isPrivate || false,
        active: true,
        billable: projectData.billable || true,
        color: projectData.color || '#06aaf5',
        rate: projectData.rate
      };

      return await this.makeRequest('post', '/projects', data);
    } catch (error) {
      console.error('Toggl create project error:', error);
      throw error;
    }
  }

  async startTimeEntry(entryData) {
    try {
      const data = {
        description: entryData.description,
        workspace_id: this.workspaceId,
        project_id: entryData.projectId,
        billable: entryData.billable || true,
        start: new Date().toISOString(),
        duration: -1 // negative duration means the time entry is running
      };

      return await this.makeRequest('post', '/time_entries', data);
    } catch (error) {
      console.error('Toggl start time entry error:', error);
      throw error;
    }
  }

  async stopTimeEntry(timeEntryId) {
    try {
      return await this.makeRequest('patch', `/time_entries/${timeEntryId}/stop`);
    } catch (error) {
      console.error('Toggl stop time entry error:', error);
      throw error;
    }
  }

  async getTimeEntries(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      return await this.makeRequest('get', `/time_entries?${params}`);
    } catch (error) {
      console.error('Toggl get time entries error:', error);
      throw error;
    }
  }

  async updateTimeEntry(timeEntryId, updateData) {
    try {
      return await this.makeRequest('put', `/time_entries/${timeEntryId}`, updateData);
    } catch (error) {
      console.error('Toggl update time entry error:', error);
      throw error;
    }
  }

  async deleteTimeEntry(timeEntryId) {
    try {
      return await this.makeRequest('delete', `/time_entries/${timeEntryId}`);
    } catch (error) {
      console.error('Toggl delete time entry error:', error);
      throw error;
    }
  }

  async getDetailedReport(startDate, endDate, options = {}) {
    try {
      const params = new URLSearchParams({
        workspace_id: this.workspaceId,
        since: startDate.toISOString(),
        until: endDate.toISOString(),
        user_agent: 'InvoiceApp',
        ...options
      });

      return await this.makeRequest('get', `/reports/details?${params}`);
    } catch (error) {
      console.error('Toggl get detailed report error:', error);
      throw error;
    }
  }

  async getSummaryReport(startDate, endDate, groupBy = 'projects', options = {}) {
    try {
      const params = new URLSearchParams({
        workspace_id: this.workspaceId,
        since: startDate.toISOString(),
        until: endDate.toISOString(),
        user_agent: 'InvoiceApp',
        grouping: groupBy,
        ...options
      });

      return await this.makeRequest('get', `/reports/summary?${params}`);
    } catch (error) {
      console.error('Toggl get summary report error:', error);
      throw error;
    }
  }

  async createTag(tagData) {
    try {
      const data = {
        name: tagData.name,
        workspace_id: this.workspaceId
      };

      return await this.makeRequest('post', '/tags', data);
    } catch (error) {
      console.error('Toggl create tag error:', error);
      throw error;
    }
  }

  async bulkUpdateTimeEntries(timeEntryIds, updateData) {
    try {
      return await this.makeRequest('put', '/time_entries/bulk_update', {
        time_entry_ids: timeEntryIds,
        ...updateData
      });
    } catch (error) {
      console.error('Toggl bulk update time entries error:', error);
      throw error;
    }
  }

  async getCurrentTimeEntry() {
    try {
      return await this.makeRequest('get', '/time_entries/current');
    } catch (error) {
      console.error('Toggl get current time entry error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getWorkspaces();
      return true;
    } catch (error) {
      console.error('Toggl test connection error:', error);
      throw error;
    }
  }
}

module.exports = new TogglService();
