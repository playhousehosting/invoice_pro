const { Dropbox } = require('dropbox');

class DropboxService {
  constructor() {
    this.defaultFolder = '/InvoiceApp';
  }

  initialize(accessToken) {
    this.client = new Dropbox({
      accessToken,
      fetch
    });
  }

  async uploadFile(filePath, content, mode = 'add') {
    try {
      const response = await this.client.filesUpload({
        path: `${this.defaultFolder}${filePath}`,
        contents: Buffer.from(content),
        mode: { '.tag': mode },
        autorename: true
      });

      // Get a shared link for the file
      const sharedLink = await this.client.sharingCreateSharedLink({
        path: response.result.path_display
      });

      return {
        ...response.result,
        sharedLink: sharedLink.result.url
      };
    } catch (error) {
      console.error('Dropbox upload file error:', error);
      throw error;
    }
  }

  async uploadInvoicePDF(invoiceNumber, pdfBuffer) {
    const filePath = `/invoices/Invoice_${invoiceNumber}.pdf`;
    return this.uploadFile(filePath, pdfBuffer);
  }

  async downloadFile(filePath) {
    try {
      const response = await this.client.filesDownload({
        path: `${this.defaultFolder}${filePath}`
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox download file error:', error);
      throw error;
    }
  }

  async listFiles(folderPath = '') {
    try {
      const response = await this.client.filesListFolder({
        path: `${this.defaultFolder}${folderPath}`,
        recursive: false
      });

      return response.result.entries;
    } catch (error) {
      console.error('Dropbox list files error:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      const response = await this.client.filesDelete({
        path: `${this.defaultFolder}${filePath}`
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox delete file error:', error);
      throw error;
    }
  }

  async createFolder(folderPath) {
    try {
      const response = await this.client.filesCreateFolderV2({
        path: `${this.defaultFolder}${folderPath}`,
        autorename: false
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox create folder error:', error);
      throw error;
    }
  }

  async moveFile(fromPath, toPath) {
    try {
      const response = await this.client.filesMoveV2({
        from_path: `${this.defaultFolder}${fromPath}`,
        to_path: `${this.defaultFolder}${toPath}`,
        autorename: true
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox move file error:', error);
      throw error;
    }
  }

  async searchFiles(query, fileExtension = null) {
    try {
      const response = await this.client.filesSearch({
        path: this.defaultFolder,
        query: fileExtension ? `${query}.${fileExtension}` : query,
        max_results: 100
      });

      return response.result.matches;
    } catch (error) {
      console.error('Dropbox search files error:', error);
      throw error;
    }
  }

  async getFileMetadata(filePath) {
    try {
      const response = await this.client.filesGetMetadata({
        path: `${this.defaultFolder}${filePath}`,
        include_media_info: true
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox get file metadata error:', error);
      throw error;
    }
  }

  async shareFile(filePath, settings = {}) {
    try {
      const response = await this.client.sharingCreateSharedLinkWithSettings({
        path: `${this.defaultFolder}${filePath}`,
        settings: {
          requested_visibility: { '.tag': 'public' },
          ...settings
        }
      });

      return response.result;
    } catch (error) {
      console.error('Dropbox share file error:', error);
      throw error;
    }
  }

  async createBackup(data, fileName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `/backups/${fileName}_${timestamp}.json`;
      
      // Create backups folder if it doesn't exist
      await this.createFolder('/backups').catch(() => {});
      
      return this.uploadFile(
        backupPath,
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('Dropbox create backup error:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupPath) {
    try {
      const backup = await this.downloadFile(backupPath);
      return JSON.parse(backup.fileBinary.toString());
    } catch (error) {
      console.error('Dropbox restore from backup error:', error);
      throw error;
    }
  }

  async getAvailableSpace() {
    try {
      const response = await this.client.usersGetSpaceUsage();
      return {
        used: response.result.used,
        allocated: response.result.allocation.allocated
      };
    } catch (error) {
      console.error('Dropbox get space usage error:', error);
      throw error;
    }
  }
}

module.exports = new DropboxService();
