package com.startuphub.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final com.startuphub.backend.repository.UserRepository userRepository;



    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
            "/assets/**", 
            "/favicon.ico", 
            "/logo.png", 
            "/*.png", 
            "/*.jpg", 
            "/*.jpeg", 
            "/*.svg", 
            "/*.gif", 
            "/*.webp", 
            "/*.css", 
            "/*.js", 
            "/index.html", 
            "/"
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints are public
                .requestMatchers("/api/v1/auth/**").permitAll()
                // Public user endpoints
                .requestMatchers("/api/v1/users/check-username").permitAll()
                // Webhooks are public
                .requestMatchers("/api/v1/webhooks/**").permitAll()
                // WebSocket endpoints
                .requestMatchers("/ws/**").permitAll()
                // Static Uploads
                .requestMatchers("/uploads/**").permitAll()
                // Frontend Static Assets & SPA Routes
                .requestMatchers("/", "/index.html", "/assets/**", "/*.js", "/*.css", "/*.png", "/*.jpg", "/*.svg", "/*.ico").permitAll()
                // Swagger UI
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter(userRepository))));

        return http.build();
    }

    public org.springframework.core.convert.converter.Converter<org.springframework.security.oauth2.jwt.Jwt, org.springframework.security.authentication.AbstractAuthenticationToken> customJwtAuthenticationConverter(com.startuphub.backend.repository.UserRepository userRepository) {
        return jwt -> {
            String clerkId = jwt.getSubject();
            java.util.Optional<com.startuphub.backend.entity.User> userOpt = userRepository.findByClerkId(clerkId);
            
            if (userOpt.isPresent()) {
                com.startuphub.backend.security.CustomUserDetails userDetails = new com.startuphub.backend.security.CustomUserDetails(userOpt.get());
                return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(userDetails, jwt, userDetails.getAuthorities());
            }
            
            JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
            converter.setPrincipalClaimName("sub");
            return converter.convert(jwt);
        };
    }



    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
