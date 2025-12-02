# Use uma imagem base super leve
FROM alpine:latest

# Instala o bash e as ferramentas GNU completas (coreutils, grep, sed, gawk)
RUN apk add --no-cache bash coreutils grep sed gawk

# Cria um usuário não-root para segurança
RUN adduser -D -u 1000 aluno
USER aluno
WORKDIR /home/aluno

# Define o entrypoint padrão
CMD ["/bin/bash"]
