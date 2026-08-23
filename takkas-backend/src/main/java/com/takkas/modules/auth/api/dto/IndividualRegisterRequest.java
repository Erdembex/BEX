package com.takkas.modules.auth.api.dto;

import com.takkas.modules.user.domain.enums.Gender;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record IndividualRegisterRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[A-Z]).{8,}$",
             message = "En az 8 karakter, 1 rakam, 1 büyük harf")
    String password,
    @NotBlank String fullName,
    @NotBlank String city,
    @NotBlank String district,
    @NotNull @Past LocalDate birthDate,
    @NotNull Gender gender,
    @NotEmpty List<Skill> skills
) {}
