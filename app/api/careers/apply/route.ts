import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';
import JobApplication from '@/lib/models/JobApplication';
import { uploadToCloudinary } from '@/lib/models/uploadToCloudinary';

export async function POST(req: NextRequest) {
  try {
    // 🔐 Resolve IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               req.headers.get('cf-connecting-ip') ||
               'unknown';

    await connectDB();

    // 🔐 1. Database-backed Rate Limiting: Max 3 applications per 24 hours per IP
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const previousSubmissionsCount = await JobApplication.countDocuments({
      ipAddress: ip,
      createdAt: { $gte: oneDayAgo },
    });

    if (previousSubmissionsCount >= 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded: A maximum of 3 applications per 24 hours is permitted from your network.' 
        },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    
    const vacancyId = formData.get('vacancyId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const country = formData.get('country') as string;
    const city = formData.get('city') as string;
    const dobString = formData.get('dob') as string;
    const gender = formData.get('gender') as 'male' | 'female' | 'prefer_not_say';
    const address = formData.get('address') as string;
    const hasExperience = formData.get('hasExperience') === 'true';
    const experienceYearsString = formData.get('experienceYears') as string;
    const referred = formData.get('referred') === 'true';
    const refereeName = formData.get('refereeName') as string;
    const refereeEmail = formData.get('refereeEmail') as string;
    const refereeMobile = formData.get('refereeMobile') as string;
    const email = formData.get('email') as string;
    const mobile = formData.get('mobile') as string;
    const turnstileToken = formData.get('turnstileToken') as string;
    const resumeFile = formData.get('resume') as File;

    // 🔐 2. Cloudflare Turnstile token validation
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: 'Security verification check is missing.' },
        { status: 400 }
      );
    }

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }),
      }
    );

    const turnstileData = await turnstileResponse.json();
    if (!turnstileData.success) {
      return NextResponse.json(
        { success: false, error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Input Validations
    if (!vacancyId || !firstName || !lastName || !country || !city || !dobString || !gender || !address || !email || !mobile) {
      return NextResponse.json(
        { success: false, error: 'All mandatory fields must be provided.' },
        { status: 400 }
      );
    }

    // Validate Vacancy exists and is active
    const vacancy = await Vacancy.findOne({ _id: vacancyId, status: 'active' });
    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: 'The job posting selected is no longer active.' },
        { status: 404 }
      );
    }

    // DOB & Age Auto-calculation verification
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid Date of Birth format.' },
        { status: 400 }
      );
    }

    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 16) {
      return NextResponse.json(
        { success: false, error: 'Applicants must be at least 16 years of age.' },
        { status: 400 }
      );
    }

    // Experience Years Validation
    let experienceYears: number | undefined = undefined;
    if (hasExperience) {
      if (!experienceYearsString) {
        return NextResponse.json(
          { success: false, error: 'Please specify your years of experience.' },
          { status: 400 }
        );
      }
      experienceYears = parseInt(experienceYearsString);
      if (isNaN(experienceYears) || experienceYears < 0 || experienceYears > 99) {
        return NextResponse.json(
          { success: false, error: 'Years of experience must be a 2-digit positive integer.' },
          { status: 400 }
        );
      }
    }

    // Referee Validation
    if (referred && !refereeName) {
      return NextResponse.json(
        { success: false, error: 'Referee name is required for referred submissions.' },
        { status: 400 }
      );
    }

    // 🔐 3. File Validation (Resume)
    if (!resumeFile) {
      return NextResponse.json(
        { success: false, error: 'Resume document file is required.' },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PDF and DOCX documents are allowed.' },
        { status: 400 }
      );
    }

    // Limit to 5MB
    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size limit exceeded. Resume file must be under 5MB.' },
        { status: 400 }
      );
    }

    // 🔐 4. Upload Resume to Cloudinary as raw format
    let resumeUrl = '';
    try {
      const arrayBuffer = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64File = `data:${resumeFile.type};base64,${buffer.toString('base64')}`;

      const uploadResult = await uploadToCloudinary(base64File, {
        folder: 'winsor/resumes',
        resourceType: 'raw',
      });
      resumeUrl = uploadResult.url;
    } catch (uploadError: any) {
      console.error('Resume upload to Cloudinary error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload resume document. Please try again.' },
        { status: 500 }
      );
    }

    // 🔐 5. Create Job Application
    const jobApplication = await JobApplication.create({
      vacancyId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country,
      city: city.trim(),
      dob,
      age: calculatedAge,
      gender,
      address: address.trim(),
      hasExperience,
      experienceYears,
      referred,
      refereeName: referred ? refereeName.trim() : undefined,
      refereeEmail: referred && refereeEmail ? refereeEmail.trim() : undefined,
      refereeMobile: referred && refereeMobile ? refereeMobile.trim() : undefined,
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      resumeUrl,
      status: 'pending',
      ipAddress: ip,
    });

    // 🔐 6. Increment applicant count on Vacancy
    vacancy.applicantCount += 1;
    await vacancy.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your application has been submitted successfully.',
        referenceId: jobApplication._id.toString() 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Job application submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing your application.' },
      { status: 500 }
    );
  }
}
