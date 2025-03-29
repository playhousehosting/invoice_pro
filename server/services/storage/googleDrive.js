const { google } = require('googleapis');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLOUD_CLIENT_ID,
      process.env.GOOGLE_CLOUD_CLIENT_SECRET,
      `${process.env.APP_URL}/api/auth/google/callback`
    );

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.defaultFolderName = 'InvoiceApp';
  }

  async authenticate(tokens) {
    this.auth.setCredentials(tokens);
  }

  async createFolder(folderName = this.defaultFolderName, parentFolderId = null) {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] })
      };

      const folder = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink'
      });

      return folder.data;
    } catch (error) {
      console.error('Google Drive create folder error:', error);
      throw error;
    }
  }

  async uploadFile(fileName, fileContent, mimeType, folderId = null) {
    try {
      const fileMetadata = {
        name: fileName,
        ...(folderId && { parents: [folderId] })
      };

      const media = {
        mimeType,
        body: Buffer.from(fileContent)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      return file.data;
    } catch (error) {
      console.error('Google Drive upload file error:', error);
      throw error;
    }
  }

  async uploadInvoicePDF(invoiceNumber, pdfBuffer, folderId = null) {
    const fileName = `Invoice_${invoiceNumber}.pdf`;
    return this.uploadFile(
      fileName,
      pdfBuffer,
      'application/pdf',
      folderId
    );
  }

  async listFiles(folderId = null, pageSize = 100) {
    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Google Drive list files error:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Google Drive download file error:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (error) {
      console.error('Google Drive delete file error:', error);
      throw error;
    }
  }

  async searchFiles(query, mimeType = null) {
    try {
      let fullQuery = `name contains '${query}'`;
      if (mimeType) {
        fullQuery += ` and mimeType='${mimeType}'`;
      }

      const response = await this.drive.files.list({
        q: fullQuery,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Google Drive search files error:', error);
      throw error;
    }
  }

  async shareFile(fileId, emailAddress, role = 'reader') {
    try {
      const permission = {
        type: 'user',
        role,
        emailAddress
      };

      await this.drive.permissions.create({
        fileId,
        requestBody: permission,
        sendNotificationEmail: true
      });

      const file = await this.drive.files.get({
        fileId,
        fields: 'webViewLink, webContentLink'
      });

      return file.data;
    } catch (error) {
      console.error('Google Drive share file error:', error);
      throw error;
    }
  }

  async updateFile(fileId, newContent, mimeType) {
    try {
      const media = {
        mimeType,
        body: Buffer.from(newContent)
      };

      const file = await this.drive.files.update({
        fileId,
        media,
        fields: 'id, name, webViewLink, webContentLink, modifiedTime'
      });

      return file.data;
    } catch (error) {
      console.error('Google Drive update file error:', error);
      throw error;
    }
  }

  async createBackup(data, fileName) {
    try {
      const backupFolder = await this.createFolder('Backups', null);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${fileName}_${timestamp}.json`;
      
      return this.uploadFile(
        backupFileName,
        JSON.stringify(data, null, 2),
        'application/json',
        backupFolder.id
      );
    } catch (error) {
      console.error('Google Drive create backup error:', error);
      throw error;
    }
  }

  async restoreFromBackup(fileId) {
    try {
      const backupData = await this.downloadFile(fileId);
      return JSON.parse(backupData.toString());
    } catch (error) {
      console.error('Google Drive restore from backup error:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();
