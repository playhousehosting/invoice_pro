const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');

class OneDriveService {
  constructor() {
    this.defaultFolder = 'InvoiceApp';
    this.credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );

    this.authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    this.client = Client.initWithMiddleware({
      authProvider: this.authProvider
    });
  }

  async initialize() {
    try {
      // Create default folder if it doesn't exist
      await this.createFolder(this.defaultFolder).catch(() => {});
    } catch (error) {
      console.error('OneDrive initialization error:', error);
      throw error;
    }
  }

  async uploadFile(fileName, content, folderPath = '') {
    try {
      const targetPath = folderPath ? `${this.defaultFolder}/${folderPath}/${fileName}` : `${this.defaultFolder}/${fileName}`;
      
      // For files smaller than 4MB
      if (content.length < 4 * 1024 * 1024) {
        const response = await this.client.api(`/me/drive/root:/${targetPath}:/content`)
          .put(Buffer.from(content));
        return response;
      }

      // For larger files, use upload session
      const uploadSession = await this.client.api(`/me/drive/root:/${targetPath}:/createUploadSession`)
        .post({});

      const maxSliceSize = 320 * 1024; // 320KB chunk size
      const fileSize = content.length;
      const uploadUrl = uploadSession.uploadUrl;

      for (let offset = 0; offset < fileSize; offset += maxSliceSize) {
        const chunk = content.slice(offset, Math.min(offset + maxSliceSize, fileSize));
        const range = `bytes ${offset}-${Math.min(offset + chunk.length - 1, fileSize - 1)}/${fileSize}`;

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': chunk.length,
            'Content-Range': range
          },
          body: chunk
        });
      }

      return uploadSession;
    } catch (error) {
      console.error('OneDrive upload file error:', error);
      throw error;
    }
  }

  async uploadInvoicePDF(invoiceNumber, pdfBuffer) {
    const fileName = `Invoice_${invoiceNumber}.pdf`;
    return this.uploadFile(fileName, pdfBuffer, 'invoices');
  }

  async downloadFile(filePath) {
    try {
      const response = await this.client.api(`/me/drive/root:/${this.defaultFolder}/${filePath}:/content`)
        .get();

      return response;
    } catch (error) {
      console.error('OneDrive download file error:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentPath = '') {
    try {
      const path = parentPath ? `${this.defaultFolder}/${parentPath}/${folderName}` : `${this.defaultFolder}/${folderName}`;
      
      const driveItem = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      const response = await this.client.api(`/me/drive/root:/${path}`)
        .put(driveItem);

      return response;
    } catch (error) {
      console.error('OneDrive create folder error:', error);
      throw error;
    }
  }

  async listFiles(folderPath = '') {
    try {
      const path = folderPath ? `${this.defaultFolder}/${folderPath}` : this.defaultFolder;
      
      const response = await this.client.api(`/me/drive/root:/${path}:/children`)
        .get();

      return response.value;
    } catch (error) {
      console.error('OneDrive list files error:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      await this.client.api(`/me/drive/root:/${this.defaultFolder}/${filePath}`)
        .delete();

      return true;
    } catch (error) {
      console.error('OneDrive delete file error:', error);
      throw error;
    }
  }

  async moveFile(fromPath, toPath) {
    try {
      const response = await this.client.api(`/me/drive/root:/${this.defaultFolder}/${fromPath}`)
        .patch({
          parentReference: {
            path: `/drive/root:/${this.defaultFolder}/${toPath}`
          }
        });

      return response;
    } catch (error) {
      console.error('OneDrive move file error:', error);
      throw error;
    }
  }

  async searchFiles(query) {
    try {
      const response = await this.client.api('/me/drive/root/search(q=\'' + query + '\')')
        .get();

      return response.value;
    } catch (error) {
      console.error('OneDrive search files error:', error);
      throw error;
    }
  }

  async shareFile(filePath, type = 'view') {
    try {
      const permission = {
        type: 'view',
        scope: 'anonymous'
      };

      const response = await this.client.api(`/me/drive/root:/${this.defaultFolder}/${filePath}:/createLink`)
        .post({
          type: type,
          scope: 'anonymous'
        });

      return response;
    } catch (error) {
      console.error('OneDrive share file error:', error);
      throw error;
    }
  }

  async getFileMetadata(filePath) {
    try {
      const response = await this.client.api(`/me/drive/root:/${this.defaultFolder}/${filePath}`)
        .get();

      return response;
    } catch (error) {
      console.error('OneDrive get file metadata error:', error);
      throw error;
    }
  }

  async createBackup(data, fileName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${fileName}_${timestamp}.json`;
      
      // Create backups folder if it doesn't exist
      await this.createFolder('backups').catch(() => {});
      
      return this.uploadFile(
        backupFileName,
        JSON.stringify(data, null, 2),
        'backups'
      );
    } catch (error) {
      console.error('OneDrive create backup error:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupPath) {
    try {
      const backup = await this.downloadFile(backupPath);
      return JSON.parse(backup.toString());
    } catch (error) {
      console.error('OneDrive restore from backup error:', error);
      throw error;
    }
  }
}

module.exports = new OneDriveService();
