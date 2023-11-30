import winston from 'winston';

winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console()
  ]
})

const customFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({format: 'YY-DD HH:mm:ss'}),
  // winston.format.align(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args} = info;
    // const ts = timestamp.slice(0, 19).replace('T', ' ');
    return `${timestamp} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
  }),
);

export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({format: customFormat})
  ]
});
