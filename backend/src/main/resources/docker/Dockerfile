FROM alpine:latest
RUN apk add --no-cache bash coreutils grep sed gawk python3 curl iputils
RUN adduser -D -u 1000 aluno
USER aluno
WORKDIR /home/aluno
CMD ["/bin/bash"]