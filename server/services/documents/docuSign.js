const docusign = require('docusign-esign');

class DocuSignService {
  constructor() {
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi');
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    this.integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    this.userId = process.env.DOCUSIGN_USER_ID;
  }

  async authenticate(jwtToken) {
    try {
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${jwtToken}`);
      const userInfo = await this.apiClient.getUserInfo(jwtToken);
      return userInfo;
    } catch (error) {
      console.error('DocuSign authentication error:', error);
      throw error;
    }
  }

  async createEnvelope(document, signers) {
    try {
      // Create a new envelope definition
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.emailSubject = 'Please sign this invoice';
      
      // Add document to the envelope
      const doc = new docusign.Document();
      doc.documentBase64 = Buffer.from(document).toString('base64');
      doc.name = 'Invoice';
      doc.fileExtension = 'pdf';
      doc.documentId = '1';

      envelopeDefinition.documents = [doc];

      // Add recipients to the envelope
      const recipientsServerTemplate = new docusign.Recipients();
      recipientsServerTemplate.signers = signers.map((signer, index) => {
        const docuSignSigner = new docusign.Signer();
        docuSignSigner.email = signer.email;
        docuSignSigner.name = signer.name;
        docuSignSigner.recipientId = (index + 1).toString();
        docuSignSigner.routingOrder = (index + 1).toString();

        // Add signature field
        const signHere = new docusign.SignHere();
        signHere.documentId = '1';
        signHere.pageNumber = '1';
        signHere.recipientId = (index + 1).toString();
        signHere.xPosition = '100';
        signHere.yPosition = '100';

        docuSignSigner.tabs = new docusign.Tabs();
        docuSignSigner.tabs.signHereTabs = [signHere];

        return docuSignSigner;
      });

      envelopeDefinition.recipients = recipientsServerTemplate;
      envelopeDefinition.status = 'sent';

      // Create envelope using the eSignature API
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.createEnvelope(this.accountId, {
        envelopeDefinition
      });

      return results;
    } catch (error) {
      console.error('DocuSign create envelope error:', error);
      throw error;
    }
  }

  async getEnvelopeStatus(envelopeId) {
    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.getEnvelope(this.accountId, envelopeId);
      return results;
    } catch (error) {
      console.error('DocuSign get envelope status error:', error);
      throw error;
    }
  }

  async createEmbeddedSigningUrl(envelopeId, signerEmail, signerName, returnUrl) {
    try {
      const recipientViewRequest = new docusign.RecipientViewRequest();
      recipientViewRequest.authenticationMethod = 'email';
      recipientViewRequest.email = signerEmail;
      recipientViewRequest.userName = signerName;
      recipientViewRequest.returnUrl = returnUrl;

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.createRecipientView(
        this.accountId,
        envelopeId,
        { recipientViewRequest }
      );

      return results;
    } catch (error) {
      console.error('DocuSign create embedded signing URL error:', error);
      throw error;
    }
  }

  async voidEnvelope(envelopeId, voidReason = 'Agreement cancelled') {
    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = new docusign.Envelope();
      envelope.status = 'voided';
      envelope.voidedReason = voidReason;

      const results = await envelopesApi.update(this.accountId, envelopeId, {
        envelope
      });

      return results;
    } catch (error) {
      console.error('DocuSign void envelope error:', error);
      throw error;
    }
  }

  async downloadSignedDocument(envelopeId, documentId = '1') {
    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const document = await envelopesApi.getDocument(
        this.accountId,
        envelopeId,
        documentId
      );

      return document;
    } catch (error) {
      console.error('DocuSign download signed document error:', error);
      throw error;
    }
  }

  async createTemplate(document, templateName, roles) {
    try {
      const templatesApi = new docusign.TemplatesApi(this.apiClient);
      
      // Create template definition
      const template = new docusign.EnvelopeTemplate();
      template.name = templateName;
      template.description = 'Template for ' + templateName;
      template.emailSubject = 'Please sign this document';
      
      // Add document to template
      const doc = new docusign.Document();
      doc.documentBase64 = Buffer.from(document).toString('base64');
      doc.name = templateName;
      doc.fileExtension = 'pdf';
      doc.documentId = '1';

      template.documents = [doc];

      // Add recipient roles
      const templateRoles = roles.map((role, index) => {
        const templateRole = new docusign.TemplateRole();
        templateRole.roleName = role.name;
        templateRole.name = '';
        templateRole.email = '';

        // Add signature field for each role
        const signHere = new docusign.SignHere();
        signHere.documentId = '1';
        signHere.pageNumber = '1';
        signHere.recipientId = (index + 1).toString();
        signHere.xPosition = role.xPosition || '100';
        signHere.yPosition = role.yPosition || '100';

        templateRole.tabs = new docusign.Tabs();
        templateRole.tabs.signHereTabs = [signHere];

        return templateRole;
      });

      template.recipients = new docusign.Recipients();
      template.recipients.signers = templateRoles;

      // Create the template
      const results = await templatesApi.createTemplate(this.accountId, {
        envelopeTemplate: template
      });

      return results;
    } catch (error) {
      console.error('DocuSign create template error:', error);
      throw error;
    }
  }

  async sendEnvelopeFromTemplate(templateId, signers) {
    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      
      // Create envelope definition using template
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.templateId = templateId;
      envelopeDefinition.status = 'sent';

      // Add template roles
      envelopeDefinition.templateRoles = signers.map(signer => ({
        email: signer.email,
        name: signer.name,
        roleName: signer.roleName
      }));

      // Send the envelope
      const results = await envelopesApi.createEnvelope(this.accountId, {
        envelopeDefinition
      });

      return results;
    } catch (error) {
      console.error('DocuSign send envelope from template error:', error);
      throw error;
    }
  }
}

module.exports = new DocuSignService();
