const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

class SlackService {
  constructor() {
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.slackEvents = createEventAdapter(this.signingSecret);
  }

  initialize(config) {
    this.token = config.botToken;
    this.webClient = new WebClient(this.token);
    this.defaultChannel = config.defaultChannel;
  }

  async sendMessage(options) {
    try {
      const message = {
        channel: options.channel || this.defaultChannel,
        text: options.text,
        blocks: options.blocks,
        thread_ts: options.threadTs,
        reply_broadcast: options.broadcast
      };

      return await this.webClient.chat.postMessage(message);
    } catch (error) {
      console.error('Slack send message error:', error);
      throw error;
    }
  }

  async sendInvoiceNotification(invoice, type = 'created') {
    try {
      const message = {
        channel: this.defaultChannel,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `Invoice ${type.toUpperCase()}: #${invoice.number}`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Amount:*\n${invoice.currency} ${invoice.total}`
              },
              {
                type: 'mrkdwn',
                text: `*Due Date:*\n${invoice.dueDate}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Client:*\n${invoice.client.name}`
              },
              {
                type: 'mrkdwn',
                text: `*Status:*\n${invoice.status}`
              }
            ]
          }
        ]
      };

      return await this.webClient.chat.postMessage(message);
    } catch (error) {
      console.error('Slack send invoice notification error:', error);
      throw error;
    }
  }

  async sendPaymentNotification(payment) {
    try {
      const message = {
        channel: this.defaultChannel,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '💰 Payment Received',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Amount:*\n${payment.currency} ${payment.amount}`
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${payment.date}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Invoice:*\n#${payment.invoice.number}`
              },
              {
                type: 'mrkdwn',
                text: `*Client:*\n${payment.client.name}`
              }
            ]
          }
        ]
      };

      return await this.webClient.chat.postMessage(message);
    } catch (error) {
      console.error('Slack send payment notification error:', error);
      throw error;
    }
  }

  async sendOverdueNotification(invoice) {
    try {
      const message = {
        channel: this.defaultChannel,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⚠️ Overdue Invoice Alert',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Invoice:*\n#${invoice.number}`
              },
              {
                type: 'mrkdwn',
                text: `*Amount:*\n${invoice.currency} ${invoice.total}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Client:*\n${invoice.client.name}`
              },
              {
                type: 'mrkdwn',
                text: `*Due Date:*\n${invoice.dueDate}`
              }
            ]
          }
        ]
      };

      return await this.webClient.chat.postMessage(message);
    } catch (error) {
      console.error('Slack send overdue notification error:', error);
      throw error;
    }
  }

  async createChannel(name, isPrivate = false) {
    try {
      if (isPrivate) {
        return await this.webClient.conversations.create({
          name,
          is_private: true
        });
      }
      return await this.webClient.conversations.create({ name });
    } catch (error) {
      console.error('Slack create channel error:', error);
      throw error;
    }
  }

  async inviteToChannel(channelId, userIds) {
    try {
      return await this.webClient.conversations.invite({
        channel: channelId,
        users: Array.isArray(userIds) ? userIds.join(',') : userIds
      });
    } catch (error) {
      console.error('Slack invite to channel error:', error);
      throw error;
    }
  }

  async uploadFile(options) {
    try {
      return await this.webClient.files.upload({
        channels: options.channel || this.defaultChannel,
        file: options.file,
        filename: options.filename,
        title: options.title,
        initial_comment: options.comment,
        thread_ts: options.threadTs
      });
    } catch (error) {
      console.error('Slack upload file error:', error);
      throw error;
    }
  }

  async getChannelHistory(channelId, options = {}) {
    try {
      return await this.webClient.conversations.history({
        channel: channelId,
        limit: options.limit || 100,
        cursor: options.cursor,
        inclusive: options.inclusive,
        latest: options.latest,
        oldest: options.oldest
      });
    } catch (error) {
      console.error('Slack get channel history error:', error);
      throw error;
    }
  }

  async updateMessage(options) {
    try {
      return await this.webClient.chat.update({
        channel: options.channel,
        ts: options.timestamp,
        text: options.text,
        blocks: options.blocks
      });
    } catch (error) {
      console.error('Slack update message error:', error);
      throw error;
    }
  }

  async deleteMessage(channelId, timestamp) {
    try {
      return await this.webClient.chat.delete({
        channel: channelId,
        ts: timestamp
      });
    } catch (error) {
      console.error('Slack delete message error:', error);
      throw error;
    }
  }

  async addReaction(options) {
    try {
      return await this.webClient.reactions.add({
        channel: options.channel,
        timestamp: options.timestamp,
        name: options.reaction
      });
    } catch (error) {
      console.error('Slack add reaction error:', error);
      throw error;
    }
  }

  async searchMessages(query, options = {}) {
    try {
      return await this.webClient.search.messages({
        query,
        count: options.count,
        page: options.page,
        sort: options.sort,
        sort_dir: options.sortDir
      });
    } catch (error) {
      console.error('Slack search messages error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.webClient.auth.test();
      return true;
    } catch (error) {
      console.error('Slack test connection error:', error);
      throw error;
    }
  }
}

module.exports = new SlackService();
