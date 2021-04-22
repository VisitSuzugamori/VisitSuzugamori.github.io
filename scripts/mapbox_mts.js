const mbxTilesets = require('@mapbox/mapbox-sdk/services/tilesets');
const mbxUploads = require('@mapbox/mapbox-sdk/services/uploads');
const u = require('./common.js');

class MapboxMtsApi {
  constructor(config) {
    // ref. https://docs.mapbox.com/api/maps/mapbox-tiling-service/
    this.mts = mbxTilesets({ accessToken: config.access_token });
    this.ownerId = config.ownerId || 'isnot';
  }

  // Replace a tileset source
  async replaceTilesetSource(tilesetId, url) {
    const uploadsClient = mbxUploads({ accessToken: this.mts.accessToken });
    uploadsClient
      .createUpload({
        tileset: tilesetId,
        url: url,
      })
      .send()
      .then((response) => {
        console.log(response.body);
        return response.body;
      });
  }

  // Retrieve tileset source information
  async getTilesetSource(id) {
    this.mts
      .getTilesetSource({
        ownerId: this.ownerId,
        id,
      })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // List tileset sources
  async listTilesetSources() {
    this.mts
      .listTilesetSources({
        ownerId: this.ownerId,
      })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Publish a tileset
  async publishTileset(tilesetId) {
    this.mts
      .publishTileset({ tilesetId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Retrieve the status of a tileset
  async tilesetStatus(tilesetId) {
    this.mts
      .tilesetStatus({ tilesetId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Retrieve information about a single tileset job
  async tilesetJob({ tilesetId, jobId }) {
    this.mts
      .listTilesetJobs({ tilesetId, jobId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // List information about all jobs for a tileset
  async listTilesetJobs(tilesetId) {
    this.mts
      .listTilesetJobs({ tilesetId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // View the global queue
  async getTilesetsQueue() {
    this.mts
      .getTilesetsQueue()
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Validate a recipe
  async validateRecipe(recipe) {
    this.mts
      .validateRecipe({ recipe })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Retrieve a tileset's recipe
  async getRecipe(tilesetId) {
    this.mts
      .getRecipe({ tilesetId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Update a tileset's recipe
  async updateRecipe({ tilesetId, recipe }) {
    this.mts
      .updateRecipe({ tilesetId, recipe })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // List tilesets
  async listTilesets() {
    this.mts
      .listTilesets({
        ownerId: this.ownerId,
        sortBy: 'created',
      })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  // Retrieve TileJSON metadata
  async tileJSONMetadata(tilesetId) {
    this.mts
      .tileJSONMetadata({ tilesetId })
      .send()
      .then(
        (response) => {
          console.log(response.body);
          return response.body;
        },
        (error) => {
          console.error(error.message);
        }
      );
  }

  parseResult(x) {
    const name = u.deepRetrieve(x, 'name', '');
  }
}

module.exports = {
  MapboxMtsApi,
};
