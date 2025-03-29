const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { GoogleAuth } = require('google-auth-library');

class GoogleAnalyticsService {
  constructor() {
    this.propertyId = null;
  }

  initialize(config) {
    this.propertyId = config.propertyId;
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });

    this.analyticsDataClient = new BetaAnalyticsDataClient({ auth });
  }

  async runReport(reportConfig) {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        ...reportConfig
      });

      return this.formatReportResponse(response);
    } catch (error) {
      console.error('Google Analytics run report error:', error);
      throw error;
    }
  }

  formatReportResponse(response) {
    const formattedRows = [];

    response.rows.forEach(row => {
      const formattedRow = {};
      row.dimensionValues.forEach((value, index) => {
        formattedRow[response.dimensionHeaders[index].name] = value.value;
      });
      row.metricValues.forEach((value, index) => {
        formattedRow[response.metricHeaders[index].name] = value.value;
      });
      formattedRows.push(formattedRow);
    });

    return {
      rows: formattedRows,
      rowCount: response.rowCount,
      metadata: {
        dimensions: response.dimensionHeaders.map(header => header.name),
        metrics: response.metricHeaders.map(header => header.name)
      }
    };
  }

  async getPageViews(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'pagePath'
          }
        ],
        metrics: [
          {
            name: 'screenPageViews'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get page views error:', error);
      throw error;
    }
  }

  async getUserMetrics(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'date'
          }
        ],
        metrics: [
          {
            name: 'totalUsers'
          },
          {
            name: 'newUsers'
          },
          {
            name: 'activeUsers'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get user metrics error:', error);
      throw error;
    }
  }

  async getSessionMetrics(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'date'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'averageSessionDuration'
          },
          {
            name: 'bounceRate'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get session metrics error:', error);
      throw error;
    }
  }

  async getTrafficSource(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'source'
          },
          {
            name: 'medium'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'conversions'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get traffic source error:', error);
      throw error;
    }
  }

  async getDeviceMetrics(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'deviceCategory'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'screenPageViews'
          },
          {
            name: 'averageSessionDuration'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get device metrics error:', error);
      throw error;
    }
  }

  async getEventMetrics(startDate, endDate, eventName) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'eventName'
          },
          {
            name: 'date'
          }
        ],
        metrics: [
          {
            name: 'eventCount'
          },
          {
            name: 'eventValue'
          }
        ],
        dimensionFilter: eventName ? {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: eventName
            }
          }
        } : undefined
      });
    } catch (error) {
      console.error('Google Analytics get event metrics error:', error);
      throw error;
    }
  }

  async getConversionMetrics(startDate, endDate) {
    try {
      return await this.runReport({
        dateRanges: [
          {
            startDate,
            endDate
          }
        ],
        dimensions: [
          {
            name: 'date'
          }
        ],
        metrics: [
          {
            name: 'conversions'
          },
          {
            name: 'conversionRate'
          }
        ]
      });
    } catch (error) {
      console.error('Google Analytics get conversion metrics error:', error);
      throw error;
    }
  }

  async test(config) {
    try {
      this.initialize(config);
      await this.getPageViews('7daysAgo', 'today');
      return true;
    } catch (error) {
      console.error('Google Analytics test connection error:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAnalyticsService();
