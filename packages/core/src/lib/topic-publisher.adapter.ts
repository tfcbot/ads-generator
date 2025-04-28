import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"
import { Topic } from "@metadata/orchestrator.schema"
import { AgentMessage } from "@metadata/task.schema";


import { Resource } from "sst";

export class TopicPublisher {
  private snsClient: SNSClient;
  private topicArns: Record<Topic, string>;

  constructor() {
    this.snsClient = new SNSClient({});
    this.topicArns = {
        [Topic.task]: Resource.TaskTopic.arn
    };
  }

  async publishAgentMessage(message: AgentMessage): Promise<void> {
    const topicArn = this.topicArns[Topic.task];
    console.log("--- Publishing agent message to topic ---");
    try {
      await this.snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(message.payload),
        MessageAttributes: {
          queue: {
            DataType: 'String',
            StringValue: message.queue
          }
        }, 
         MessageGroupId: message.queue,
         MessageDeduplicationId: message.payload.id
      }));
      console.log("--- Agent message published to topic ---");
    } catch (error) {
      console.error('Error publishing to topic:', error);
      throw new Error('Failed to publish to topic');
    }
  }



}

export const topicPublisher = new TopicPublisher();
