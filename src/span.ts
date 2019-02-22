import { HoneyEvent } from 'libhoney';
import { SpanContext } from './span-context';
import { generateId } from './generate-id';
import { SpanTags } from './shared';

export class Span {
  private event: HoneyEvent;
  private serviceName: string;
  private name: string;
  private traceId: string;
  private parentId: string | undefined;
  private tags: SpanTags = {};
  private spanId: string;
  private start: Date;
  private ctx: SpanContext;

  constructor(
    event: HoneyEvent,
    serviceName: string,
    name: string,
    traceId = generateId(),
    parentId?: string,
    tags?: SpanTags,
  ) {
    const spanId = generateId();
    this.event = event;
    this.name = name;
    this.serviceName = serviceName;
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentId = parentId;
    this.tags = tags || {};
    this.ctx = new SpanContext(traceId, spanId);
    this.start = new Date();
  }

  context() {
    return this.ctx;
  }

  addTags(tags: SpanTags) {
    Object.keys(tags).forEach(key => {
      this.tags[key] = tags[key];
    });
    return this;
  }

  setTag(key: string, value: any) {
    this.tags[key] = value;
    return this;
  }

  setOperationName(name: string) {
    this.name = name;
  }

  finish() {
    const duration = Date.now() - this.start.getTime();
    this.event.addField('duration_ms', duration);
    this.event.addField('name', this.name);
    this.event.addField('service_name', this.serviceName);
    this.event.addField('trace.trace_id', this.traceId);
    this.event.addField('trace.span_id', this.spanId);
    this.event.addField('trace.parent_id', this.parentId);
    for (const [key, value] of Object.entries(this.tags)) {
      this.event.addField('tag.' + key, value);
    }
    this.event.timestamp = this.start;
    this.event.send();
  }
}