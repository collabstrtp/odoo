import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronDown, Search, DollarSign } from "lucide-react";
import { setCredentials } from "../../redux/authSlice";
import { BASE_URL } from "../../config/urlconfig";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    role: "admin",
  });

  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fallbackCountries = [
    {
      name: "United States",
      code: "US",
      currency: "USD",
      currencyName: "United States Dollar",
      currencySymbol: "$",
    },
    {
      name: "United Kingdom",
      code: "GB",
      currency: "GBP",
      currencyName: "British Pound",
      currencySymbol: "£",
    },
    {
      name: "India",
      code: "IN",
      currency: "INR",
      currencyName: "Indian Rupee",
      currencySymbol: "₹",
    },
    {
      name: "Canada",
      code: "CA",
      currency: "CAD",
      currencyName: "Canadian Dollar",
      currencySymbol: "$",
    },
    {
      name: "Australia",
      code: "AU",
      currency: "AUD",
      currencyName: "Australian Dollar",
      currencySymbol: "$",
    },
    {
      name: "Germany",
      code: "DE",
      currency: "EUR",
      currencyName: "Euro",
      currencySymbol: "€",
    },
    {
      name: "France",
      code: "FR",
      currency: "EUR",
      currencyName: "Euro",
      currencySymbol: "€",
    },
    {
      name: "Japan",
      code: "JP",
      currency: "JPY",
      currencyName: "Japanese Yen",
      currencySymbol: "¥",
    },
    {
      name: "China",
      code: "CN",
      currency: "CNY",
      currencyName: "Chinese Yuan",
      currencySymbol: "¥",
    },
    {
      name: "Brazil",
      code: "BR",
      currency: "BRL",
      currencyName: "Brazilian Real",
      currencySymbol: "R$",
    },
    {
      name: "Mexico",
      code: "MX",
      currency: "MXN",
      currencyName: "Mexican Peso",
      currencySymbol: "$",
    },
    {
      name: "South Africa",
      code: "ZA",
      currency: "ZAR",
      currencyName: "South African Rand",
      currencySymbol: "R",
    },
    {
      name: "Singapore",
      code: "SG",
      currency: "SGD",
      currencyName: "Singapore Dollar",
      currencySymbol: "$",
    },
    {
      name: "United Arab Emirates",
      code: "AE",
      currency: "AED",
      currencyName: "UAE Dirham",
      currencySymbol: "د.إ",
    },
    {
      name: "Switzerland",
      code: "CH",
      currency: "CHF",
      currencyName: "Swiss Franc",
      currencySymbol: "Fr",
    },
  ];

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://restcountries.com/v2/all", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        setCountries(fallbackCountries);
        setFilteredCountries(fallbackCountries);
        setLoading(false);
        return;
      }

      const formatted = data
        .map((country) => {
          const currencies = country.currencies || [];
          const currency = currencies[0] || {};

          return {
            name: country.name,
            code: country.alpha2Code,
            currency: currency.code || "N/A",
            currencyName: currency.name || "Unknown",
            currencySymbol: currency.symbol || "",
          };
        })
        .filter((country) => country.currency !== "N/A")
        .sort((a, b) => a.name.localeCompare(b.name));

      setCountries(formatted);
      setFilteredCountries(formatted);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch countries:", error.message);
      setCountries(fallbackCountries);
      setFilteredCountries(fallbackCountries);
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = countries.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  };

  const validatePassword = (pwd) => {
    const errs = [];
    if (pwd.length < 8) errs.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errs.push("one uppercase letter");
    if (!/[a-z]/.test(pwd)) errs.push("one lowercase letter");
    if (!/[0-9]/.test(pwd)) errs.push("one number");
    if (!/[!@#$%^&*]/.test(pwd)) errs.push("one special character (!@#$%^&*)");
    return errs;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.company.trim())
      newErrors.company = "Company name is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    const pwdErrors = validatePassword(formData.password);
    if (pwdErrors.length > 0) {
      newErrors.password = "Password must contain " + pwdErrors.join(", ");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.country) newErrors.country = "Please select a country";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const selectedCountry = countries.find(
        (c) => c.name === formData.country
      );

      const payload = {
        companyName: formData.company,
        country: formData.country,
        currency: selectedCountry.currency,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      console.log("Sending signup request with payload:", payload);

      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Map role to numeric value
      let numericRole;
      switch (data.user.role) {
        case "admin":
          numericRole = 1;
          break;
        case "manager":
          numericRole = 2;
          break;
        case "employee":
        default:
          numericRole = 3;
      }

      dispatch(
        setCredentials({
          user: { ...data.user, role: numericRole },
          token: data.token,
        })
      );

      alert(
        `Account created successfully! Default currency: ${selectedCountry.currency}`
      );

      navigate("/admin/dashboard");

      console.log("Signup successful:", data);
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({
        submit: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectCountry = (country) => {
    setFormData({ ...formData, country: country.name });
    setDropdownOpen(false);
    setSearchQuery("");
    setErrors({ ...errors, country: "" });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-end p-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://d1ss4nmhr4m5he.cloudfront.net/wp-content/uploads/sites/3/2024/10/27141427/What-are-Business-Expenses.jpg)",
      }}
    >
      <div className="w-full max-w-[500px] mr-8 md:mr-16 lg:mr-24">
        <div className="border-4 border-black rounded-3xl p-6 bg-black">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <h1 className="text-2xl font-bold text-white">SpendWise</h1>
            </div>
          </div>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-500 border-2 border-red-700 rounded-xl text-white text-sm">
              {errors.submit}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => {
                  setFormData({ ...formData, company: e.target.value });
                  setErrors({ ...errors, company: "" });
                }}
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                placeholder="Acme Inc"
              />
              {errors.company && (
                <p className="text-red-400 text-sm mt-1">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Admin Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: "" });
                }}
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: "" });
                  }}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    });
                    setErrors({ ...errors, confirmPassword: "" });
                  }}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Country
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-left text-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                >
                  {formData.country || "Select your country"}
                </button>
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />

                {dropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-3 border-b-2 border-black">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-black text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="Search countries..."
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-gray-600">
                          Loading countries...
                        </div>
                      ) : filteredCountries.length === 0 ? (
                        <div className="p-4 text-center text-gray-600">
                          No countries found
                        </div>
                      ) : (
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => selectCountry(country)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition text-black text-sm flex items-center justify-between group"
                          >
                            <span>{country.name}</span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-700">
                              {country.currency}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.country && (
                <p className="text-red-400 text-sm mt-1">{errors.country}</p>
              )}
              {formData.country && (
                <p className="text-gray-300 text-xs mt-2">
                  Default currency:{" "}
                  {countries.find((c) => c.name === formData.country)?.currency}{" "}
                  (
                  {
                    countries.find((c) => c.name === formData.country)
                      ?.currencyName
                  }
                  )
                </p>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-white border-2 border-black hover:bg-black hover:text-white text-black font-medium px-12 py-2 rounded-full transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? "Creating Account..." : "Sign Up"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white text-sm">
              Already have an account?{" "}
              <a
                href="/"
                className="font-semibold underline hover:text-gray-300 transition"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
