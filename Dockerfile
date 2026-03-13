FROM public.ecr.aws/lambda/nodejs:20
ARG github_token
COPY *.json ${LAMBDA_TASK_ROOT}
COPY .env.example ${LAMBDA_TASK_ROOT}
COPY .*rc ${LAMBDA_TASK_ROOT}
COPY database ${LAMBDA_TASK_ROOT}/database
COPY src ${LAMBDA_TASK_ROOT}/src
ENV GITHUB_TOKEN=$github_token
RUN npm install
RUN npm run build
RUN npm run docs:docker && rm -f .env.example
EXPOSE 3300
EXPOSE 8080
CMD [".dist/src/lambda-http.handler"]