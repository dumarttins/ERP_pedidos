FROM php:8.2-fpm

# Instalar dependências
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Limpar cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar extensões PHP
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Obter Composer mais recente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar diretório de trabalho
WORKDIR /var/www

# Copiar código-fonte da aplicação
COPY . /var/www

# Definir permissões para o diretório de armazenamento
RUN chmod -R 775 /var/www/storage

# Expor porta 9000
EXPOSE 9000

# Iniciar servidor PHP-FPM
CMD ["php-fpm"]