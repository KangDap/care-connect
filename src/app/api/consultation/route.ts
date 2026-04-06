import { prisma } from '@/lib/prisma';
import { getSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // const session = await auth.api.getSession({ headers: await headers() });

    // if (!session || !session.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    // if (!session.user.id) {
    //   return NextResponse.json(
    //     { error: "Invalid user session" },
    //     { status: 401 }
    //   );
    // }

    const userId = '4FmE332k37qyeZEYsb4b45cb34jydLke';

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const category = formData.get('nature') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const isAnonymous = formData.get('isAnonymous') === 'on';

    const file = formData.get('document') as File;

    let attachmentUrl = null;

    const supabase = getSupabaseClient();

    if (file && file.size > 0 && supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('consultation-files')
        .upload(fileName, file);

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 500 },
        );
      }

      const { data: publicUrl } = supabase.storage
        .from('consultation-files')
        .getPublicUrl(fileName);

      attachmentUrl = publicUrl.publicUrl;
    } else if (file && file.size > 0) {
      attachmentUrl = null;
    }

    if (!title || !category || !description || !date || !time) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const selectedDate = new Date(date);
    const selectedTime = new Date(`1970-01-01T${time}:00`);

    // //1. CARI PSIKOLOG BERDASARKAN HARI
    // const dayOfWeek = selectedDate.getDay();

    // const schedules = await prisma.schedule.findMany({
    //   where: { dayOfWeek }
    // });

    // const availablePsychIds = schedules
    //   .filter(s =>
    //     s.startTime <= selectedTime &&
    //     s.endTime >= selectedTime
    //   )
    //   .map(s => s.userId);

    // if (availablePsychIds.length === 0) {
    //   return NextResponse.json(
    //     { error: "No psychologist available at this time" },
    //     { status: 400 }
    //   );
    // }

    // //2. AMBIL CONSULTATION DI HARI ITU
    // const existing = await prisma.consultation.findMany({
    //   where: {
    //     date: {
    //       gte: new Date(date + "T00:00:00"),
    //       lt: new Date(date + "T23:59:59")
    //     }
    //   }
    // });

    // //3. FILTER YANG JAM SAMA
    // const usedPsychIds = existing
    //   .filter(c => {
    //     const bookedTime = c.time.toTimeString().slice(0, 5);
    //     return bookedTime === time;
    //   })
    //   .map(c => c.psychologistId);

    // //4. PILIH PSIKOLOG YANG MASIH FREE
    // const availablePsych = availablePsychIds.find(
    //   id => !usedPsychIds.includes(id)
    // );

    // if (!availablePsych) {
    //   return NextResponse.json(
    //     { error: "This time slot is full" },
    //     { status: 400 }
    //   );
    // }

    const psychologistId = '4FmE332k37qyeZEYsb4b45cb34jydLke';

    //5. CREATE CONSULTATION
    const consultation = await prisma.consultation.create({
      data: {
        // userId: session.user.id,
        userId: userId,
        // psychologistId: availablePsych,
        psychologistId: psychologistId,

        title,
        category,
        description,

        date: selectedDate,
        time: selectedTime,

        isAnonymous,
        status: 'SCHEDULED',

        attachmentUrl,
      },
    });

    //6. RESPONSE SUCCESS
    return NextResponse.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    console.error('CONSULTATION ERROR FULL:', error);

    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
