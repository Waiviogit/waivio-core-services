import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  wobjectPendingUpdateModel,
  type WobjectPendingUpdateDocument,
} from '@waivio-core-services/clients';

@Injectable()
export class WobjectPendingUpdateRepository extends MongoRepository<
  WobjectPendingUpdateDocument,
  Partial<WobjectPendingUpdateDocument>
> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      wobjectPendingUpdateModel(
        mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO),
      ),
      new Logger(WobjectPendingUpdateRepository.name),
    );
  }

  /**
   * Get count of documents by authorPermlink and id
   */
  async getDocumentsCountByAuthorPermlinkId(params: {
    authorPermlink: string;
    id: string;
  }): Promise<number> {
    try {
      return await this.model.countDocuments({
        authorPermlink: params.authorPermlink,
        id: params.id,
      });
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get all documents by authorPermlink and id, sorted by partNumber
   */
  async getDocumentsByAuthorPermlinkId(params: {
    authorPermlink: string;
    id: string;
  }): Promise<WobjectPendingUpdateDocument[]> {
    try {
      return await this.model
        .find({
          authorPermlink: params.authorPermlink,
          id: params.id,
        })
        .sort({ partNumber: 1 })
        .lean();
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete all documents by authorPermlink and id
   */
  async deleteDocumentsByAuthorPermlinkId(params: {
    authorPermlink: string;
    id: string;
  }): Promise<void> {
    try {
      await this.model.deleteMany({
        authorPermlink: params.authorPermlink,
        id: params.id,
      });
    } catch (error) {
      // Ignore errors
    }
  }
}
